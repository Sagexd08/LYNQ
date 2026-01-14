import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BlockchainService } from '../src/blockchain/blockchain.service';
import { ethers } from 'ethers';

describe('Loan Flow E2E (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let userId: string;
    let loanId: string;

    const testWallet = '0x1234567890123456789012345678901234567890';
    const testPrivateKey = '0x0000000000000000000000000000000000000000000000000000000000000001';
    const testWalletSigner = new ethers.Wallet(testPrivateKey);

    const mockBlockchainService = {
        isBlockchainConnected: jest.fn().mockReturnValue(true),
        verifyCollateralDeposit: jest.fn().mockResolvedValue(true),
        verifyRepayment: jest.fn().mockResolvedValue(true),
        createLoanOnChain: jest.fn().mockResolvedValue({
            loanId: '0x' + '1'.repeat(64),
            txHash: '0x' + '2'.repeat(64),
        }),
        activateLoanOnChain: jest.fn().mockResolvedValue('0x' + '3'.repeat(64)),
        unlockCollateralOnChain: jest.fn().mockResolvedValue(undefined),
        getLoanFromChain: jest.fn().mockResolvedValue({
            loanId: '0x' + '1'.repeat(64),
            borrower: testWallet,
            amount: ethers.parseEther('1000').toString(),
            interestRate: 500,
            termDays: 180,
            createdAt: Math.floor(Date.now() / 1000),
            dueDate: Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60,
            amountRepaid: '0',
            status: 1,
        }),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(BlockchainService)
            .useValue(mockBlockchainService)
            .compile();

        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get<PrismaService>(PrismaService);
        await app.init();

        // Setup: Create test user and get auth token
        // Request challenge
        const challengeRes = await request(app.getHttpServer())
            .post('/api/v1/auth/wallet/challenge')
            .send({ walletAddress: testWallet });

        expect(challengeRes.status).toBe(200);
        const { nonce, message } = challengeRes.body;

        // Sign the message with test wallet
        const signature = await testWalletSigner.signMessage(message);

        // Verify signature and get token
        const verifyRes = await request(app.getHttpServer())
            .post('/api/v1/auth/wallet/verify')
            .send({
                walletAddress: testWallet,
                signature,
                nonce,
            });

        expect(verifyRes.status).toBe(200);
        authToken = verifyRes.body.accessToken;
        userId = verifyRes.body.profile.id;
    });

    afterAll(async () => {
        // Cleanup test data
        if (loanId) {
            await prisma.loan.delete({ where: { id: loanId } }).catch(() => {});
        }
        if (userId) {
            await prisma.user.delete({ where: { id: userId } }).catch(() => {});
        }
        await app.close();
    });

    describe('Complete Loan Lifecycle', () => {
        it('1. should get risk evaluation', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/risk/evaluate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    walletAddress: testWallet,
                    walletAgeDays: 365,
                    totalTransactions: 100,
                    totalVolumeUsd: 50000,
                    defiInteractions: 20,
                    loanAmount: 1000,
                    collateralValueUsd: 1500,
                    termMonths: 6,
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('creditScore');
            expect(res.body).toHaveProperty('riskLevel');
            expect(res.body.recommendedAction).not.toBe('REJECT');
        });

        it('2. should create a loan', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/loans')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 1000,
                    termMonths: 6,
                    chain: 'mantle-sepolia',
                    collateralValueUsd: 1500,
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.status).toBe('PENDING');

            loanId = res.body.id;
        });

        it('3. should activate loan with collateral', async () => {
            // Mock successful verification
            mockBlockchainService.verifyCollateralDeposit.mockResolvedValueOnce(true);
            mockBlockchainService.activateLoanOnChain.mockResolvedValueOnce('0x' + '3'.repeat(64));

            const res = await request(app.getHttpServer())
                .post(`/api/v1/loans/${loanId}/activate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    tokenAddress: '0xDeadBeef00000000000000000000000000000000',
                    tokenSymbol: 'MNT',
                    amount: '1500',
                    chainId: 5003,
                    txHash: '0x' + '4'.repeat(64),
                });

            // With mocked blockchain service, expect success
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status');
            expect(res.body.status).toBe('ACTIVE');
        });

        it('4. should repay loan', async () => {
            // Ensure loan is active and has onChainLoanId
            await prisma.loan.update({
                where: { id: loanId },
                data: { 
                    status: 'ACTIVE', 
                    startDate: new Date(),
                    onChainLoanId: '0x' + '1'.repeat(64),
                },
            });

            // Mock successful repayment verification
            mockBlockchainService.verifyRepayment.mockResolvedValueOnce(true);

            const res = await request(app.getHttpServer())
                .post(`/api/v1/loans/${loanId}/repay`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 1050, // Principal + interest
                    txHash: '0x' + '5'.repeat(64),
                });

            // With mocked blockchain service, expect success
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('paymentAmount');
        });

        it('5. should update reputation after repayment', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/reputation/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('score');
        });
    });
});
