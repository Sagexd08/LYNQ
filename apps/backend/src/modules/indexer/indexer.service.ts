import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserService } from '../user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { LoanStatus, Loan } from '../../common/types/database.types';
@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(IndexerService.name);
    private provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
    private contract: ethers.Contract;
    private lastProcessedBlock = 0;
    private readonly LOAN_CORE_ADDRESS = '0x16fB626C9Ef59aa865366d086931FAcfDc70490F';
    private reconnectTimer: NodeJS.Timeout;
    private readonly ABI = [
        "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount)",
        "event LoanRepaid(uint256 indexed loanId, uint256 amount, address indexed payer)",
        "event LoanLiquidated(uint256 indexed loanId, address indexed liquidator)",
    ];
    constructor(
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly supabaseService: SupabaseService,
    ) { }
    async onModuleInit() {
        await this.start();
    }
    onModuleDestroy() {
        this.stop();
    }
    private async start() {
        try {
            const wsUrl = this.configService.get<string>('WS_RPC_URL');
            const httpUrl = this.configService.get<string>('RPC_URL') || 'http://localhost:8545';
            const address = this.configService.get<string>('LOAN_CORE_ADDRESS') || this.LOAN_CORE_ADDRESS;
            if (wsUrl) {
                this.provider = new ethers.WebSocketProvider(wsUrl);
                (this.provider.websocket as any).on('close', () => {
                    this.logger.error('WebSocket disconnected. Reconnecting...');
                    this.scheduleReconnect();
                });
            } else {
                this.logger.warn('WS_RPC_URL not configured. Falling back to JsonRpcProvider (Events might lag)');
                this.provider = new ethers.JsonRpcProvider(httpUrl);
            }
            this.contract = new ethers.Contract(address, this.ABI, this.provider);
            const currentBlock = await this.provider.getBlockNumber();
            if (this.lastProcessedBlock === 0) {
                this.lastProcessedBlock = currentBlock - 1000;
            }
            await this.catchUp(this.lastProcessedBlock, currentBlock);
            this.contract.on('LoanRepaid', async (loanId, amount, payer, event) => {
                await this.handleLoanRepaid(loanId, event);
            });
            this.contract.on('LoanLiquidated', async (loanId, liquidator, event) => {
                await this.handleLoanLiquidated(loanId, event);
            });
            this.logger.log(`Indexer started. Listening for events on ${address}`);
        } catch (e) {
            this.logger.error('Failed to start indexer', e.error || e);
            this.scheduleReconnect();
        }
    }
    private stop() {
        if (this.provider instanceof ethers.WebSocketProvider) {
            this.provider.destroy();
        }
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    }
    private scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.logger.log('Attempting to reconnect...');
            this.stop();
            this.start();
        }, 5000);
    }
    private async catchUp(fromBlock: number, toBlock: number) {
        if (fromBlock >= toBlock) return;
        this.logger.log(`Catching up from ${fromBlock} to ${toBlock}`);
        try {
            const events = await this.contract.queryFilter('*', fromBlock, toBlock);
            for (const event of events) {
                if ('eventName' in event) {
                    const log = event as ethers.EventLog;
                    if (log.eventName === 'LoanRepaid') {
                        await this.handleLoanRepaid(log.args[0], log);
                    } else if (log.eventName === 'LoanLiquidated') {
                        await this.handleLoanLiquidated(log.args[0], log);
                    }
                }
            }
            this.lastProcessedBlock = toBlock;
        } catch (e) {
            this.logger.error('Catch up failed', e);
        }
    }
    private async handleLoanRepaid(loanIdBig: any, event: any) {
        const loanId = loanIdBig.toString();
        this.logger.log(`Event: Repaid Loan ${loanId} at block ${event.blockNumber}`);
        const loan = await this.findLoanByOnChainId(loanId);
        if (loan && loan.status !== LoanStatus.REPAID) {
            await this.supabaseService.getClient().from('loans').update({
                status: LoanStatus.REPAID,
                repaidDate: new Date(),
                outstandingAmount: '0'
            }).eq('id', loan.id);
            await this.userService.updateReputationPoints(loan.userId, 100);
        }
        this.lastProcessedBlock = event.blockNumber;
    }
    private async handleLoanLiquidated(loanIdBig: any, event: any) {
        const loanId = loanIdBig.toString();
        this.logger.log(`Event: Liquidated Loan ${loanId} at block ${event.blockNumber}`);
        const loan = await this.findLoanByOnChainId(loanId);
        if (loan && loan.status !== LoanStatus.LIQUIDATED) {
            await this.supabaseService.getClient().from('loans').update({
                status: LoanStatus.LIQUIDATED
            }).eq('id', loan.id);
            await this.userService.updateReputationPoints(loan.userId, -200);
        }
        this.lastProcessedBlock = event.blockNumber;
    }
    private async findLoanByOnChainId(onChainId: string): Promise<Loan | null> {
        const { data } = await this.supabaseService.getClient()
            .from('loans')
            .select('*')
            .eq('metadata->>onChainId', onChainId)
            .maybeSingle();
        return data as Loan;
    }
}
