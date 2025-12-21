import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { BlockchainService } from '../../blockchain/blockchain.service';

export interface FlashLoanQuote {
    assets: string[];
    amounts: string[];
    premiums: string[];
    totalCosts: string[];
    riskLevel: string;
    estimatedGas: string;
    estimatedGasCost: string;
    feeBps: number;
}

export interface EligibilityCheck {
    eligible: boolean;
    reason: string;
    trustScore?: number;
    riskLevel?: string;
    cooldownRemaining?: number;
}

export interface UserStats {
    totalFlashLoans: number;
    successfulFlashLoans: number;
    failedFlashLoans: number;
    totalVolumeFlashLoaned: string;
    riskLevel: string;
    trustScore: number;
    successRate: number;
}

export interface FlashLoanResult {
    transactionHash: string;
    success: boolean;
    gasUsed: string;
    premiumsPaid: string[];
    timestamp: number;
}

@Injectable()
export class FlashLoanService {
    private readonly logger = new Logger(FlashLoanService.name);
    private flashLoanContract: ethers.Contract | null = null;
    private contractAddress: string = '';

    // Flash Loan Provider ABI (simplified)
    private readonly flashLoanABI = [
        'function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, bytes calldata params) external',
        'function getFlashLoanQuote(address[] calldata assets, uint256[] calldata amounts) external view returns (uint256[] memory premiums, uint256[] memory totalCosts, uint8 riskLevel, uint256 estimatedGas)',
        'function checkEligibility(address user, address[] calldata assets, uint256[] calldata amounts) external view returns (bool eligible, string memory reason)',
        'function getUserStats(address user) external view returns (uint256 totalFlashLoans, uint256 successfulFlashLoans, uint256 failedFlashLoans, uint256 totalVolumeFlashLoaned, uint8 riskLevel, uint256 trustScore)',
        'function getAvailableLiquidity() external view returns (address[] memory assets, uint256[] memory liquidities, uint256[] memory maxAmounts)',
        'function flashLoanFeeBps() external view returns (uint256)',
    ];

    constructor(
        private readonly configService: ConfigService,
        private readonly blockchainService: BlockchainService,
    ) {
        this.initializeContract();
    }

    private initializeContract(): void {
        this.contractAddress = this.configService.get<string>('FLASH_LOAN_CONTRACT_ADDRESS', '');
        if (this.contractAddress) {
            this.flashLoanContract = this.blockchainService.getContract(
                this.contractAddress,
                this.flashLoanABI,
                'mantleSepolia',
                false
            );
            this.logger.log(`Flash loan contract initialized at ${this.contractAddress}`);
        } else {
            this.logger.warn('FLASH_LOAN_CONTRACT_ADDRESS not set - flash loan features disabled');
        }
    }

    async getFlashLoanQuote(
        userAddress: string,
        assets: string[],
        amounts: string[]
    ): Promise<FlashLoanQuote> {
        if (!this.flashLoanContract) {
            throw new Error('Flash loan contract not initialized');
        }

        const provider = this.blockchainService.getProvider('mantleSepolia');
        const feeBps = await this.flashLoanContract.flashLoanFeeBps();

        const [premiums, totalCosts, riskLevel, estimatedGas] =
            await this.flashLoanContract.getFlashLoanQuote(assets, amounts);

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        const estimatedGasCost = (BigInt(estimatedGas) * gasPrice).toString();

        const riskLevels = ['Low', 'Medium', 'High', 'Critical'];

        return {
            assets,
            amounts: amounts.map(a => a.toString()),
            premiums: premiums.map((p: bigint) => p.toString()),
            totalCosts: totalCosts.map((c: bigint) => c.toString()),
            riskLevel: riskLevels[Number(riskLevel)],
            estimatedGas: estimatedGas.toString(),
            estimatedGasCost,
            feeBps: Number(feeBps),
        };
    }

    async checkEligibility(
        userAddress: string,
        assets: string[],
        amounts: string[]
    ): Promise<EligibilityCheck> {
        if (!this.flashLoanContract) {
            throw new Error('Flash loan contract not initialized');
        }

        const [eligible, reason] = await this.flashLoanContract.checkEligibility(
            userAddress,
            assets,
            amounts
        );

        const stats = await this.getUserStats(userAddress);

        return {
            eligible,
            reason: reason || (eligible ? 'User is eligible' : 'Unknown reason'),
            trustScore: stats.trustScore,
            riskLevel: stats.riskLevel,
            cooldownRemaining: eligible ? 0 : 3600,
        };
    }

    async getUserStats(userAddress: string): Promise<UserStats> {
        if (!this.flashLoanContract) {
            // Return default stats if contract not initialized
            return {
                totalFlashLoans: 0,
                successfulFlashLoans: 0,
                failedFlashLoans: 0,
                totalVolumeFlashLoaned: '0',
                riskLevel: 'Low',
                trustScore: 500,
                successRate: 0,
            };
        }

        const [
            totalFlashLoans,
            successfulFlashLoans,
            failedFlashLoans,
            totalVolumeFlashLoaned,
            riskLevel,
            trustScore,
        ] = await this.flashLoanContract.getUserStats(userAddress);

        const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
        const successRate = Number(totalFlashLoans) > 0
            ? (Number(successfulFlashLoans) / Number(totalFlashLoans)) * 100
            : 0;

        return {
            totalFlashLoans: Number(totalFlashLoans),
            successfulFlashLoans: Number(successfulFlashLoans),
            failedFlashLoans: Number(failedFlashLoans),
            totalVolumeFlashLoaned: totalVolumeFlashLoaned.toString(),
            riskLevel: riskLevels[Number(riskLevel)],
            trustScore: Number(trustScore),
            successRate: Math.round(successRate * 100) / 100,
        };
    }

    async getAvailableLiquidity(): Promise<{
        assets: Array<{ address: string; liquidity: string; maxAmount: string }>;
    }> {
        if (!this.flashLoanContract) {
            throw new Error('Flash loan contract not initialized');
        }

        const [assetAddresses, liquidities, maxAmounts] =
            await this.flashLoanContract.getAvailableLiquidity();

        const assets = assetAddresses.map((address: string, index: number) => ({
            address,
            liquidity: liquidities[index].toString(),
            maxAmount: maxAmounts[index].toString(),
        }));

        return { assets };
    }

    async executeFlashLoan(
        userAddress: string,
        receiverAddress: string,
        assets: string[],
        amounts: string[],
        params: string
    ): Promise<FlashLoanResult> {
        if (!this.flashLoanContract) {
            throw new Error('Flash loan contract not initialized');
        }

        const privateKey = this.configService.get<string>('FLASH_LOAN_OPERATOR_PRIVATE_KEY');
        if (!privateKey) {
            throw new Error('Flash loan operator private key not configured');
        }

        const contract = this.blockchainService.getContract(
            this.contractAddress,
            this.flashLoanABI,
            'mantleSepolia',
            true
        );

        this.logger.log(`Executing flash loan for ${userAddress}`);

        const bigIntAmounts = amounts.map(amount => BigInt(amount));

        const tx = await contract.flashLoan(
            receiverAddress,
            assets,
            bigIntAmounts,
            params
        );

        const receipt = await tx.wait();
        const quote = await this.getFlashLoanQuote(userAddress, assets, amounts);

        return {
            transactionHash: receipt.hash,
            success: true,
            gasUsed: receipt.gasUsed.toString(),
            premiumsPaid: quote.premiums,
            timestamp: Date.now(),
        };
    }
}
