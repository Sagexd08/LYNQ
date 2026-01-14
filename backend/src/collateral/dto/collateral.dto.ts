import { IsString, IsNumber, IsOptional, Min, IsEthereumAddress, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LockCollateralDto {
    @ApiProperty({ description: 'Loan ID to lock collateral for' })
    @IsString()
    loanId: string;

    @ApiProperty({ description: 'Token contract address' })
    @IsString()
    @IsEthereumAddress()
    tokenAddress: string;

    @ApiProperty({ description: 'Token symbol (e.g., ETH, USDC)' })
    @IsString()
    tokenSymbol: string;

    @ApiProperty({ description: 'Amount of tokens to lock' })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ description: 'Chain ID where collateral is locked' })
    @IsInt()
    chainId: number;

    @ApiPropertyOptional({ description: 'On-chain transaction hash' })
    @IsString()
    @IsOptional()
    txHash?: string;
}

export class UnlockCollateralDto {
    @ApiProperty({ description: 'Loan ID to unlock collateral for' })
    @IsString()
    loanId: string;

    @ApiPropertyOptional({ description: 'Token contract address' })
    @IsString()
    @IsEthereumAddress()
    @IsOptional()
    tokenAddress?: string;

    @ApiPropertyOptional({ description: 'On-chain transaction hash' })
    @IsString()
    @IsOptional()
    txHash?: string;
}
