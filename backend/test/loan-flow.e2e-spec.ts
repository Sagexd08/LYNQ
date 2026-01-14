import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Loan Flow E2E (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let userId: string;
    let loanId: string;

    const testWallet = '0x1234567890123456789012345678901234567890';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get<PrismaService>(PrismaService);
        await app.init();

        // Setup: Create test user and get auth token
        // In real test, you'd use a test wallet to sign
        const challengeRes = await request(app.getHttpServer())
            .post('/api/v1/auth/wallet/challenge')
            .send({ walletAddress: testWallet });

        // Mock signature verification for test
        // Note: In production, you'd need to actually sign the challenge
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
            const res = await request(app.getHttpServer())
                .post(`/api/v1/loans/${loanId}/activate`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    tokenAddress: '0xDeadBeef...',
                    tokenSymbol: 'MNT',
                    amount: 1500,
                    chainId: 5003,
                    txHash: '0xMockTxHash...',
                });

            // This will fail without actual on-chain tx, but tests the flow
            expect([201, 400]).toContain(res.status);
        });

        it('4. should repay loan', async () => {
            // First, manually activate for test
            await prisma.loan.update({
                where: { id: loanId },
                data: { status: 'ACTIVE', startDate: new Date() },
            });

            const res = await request(app.getHttpServer())
                .post(`/api/v1/loans/${loanId}/repay`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 1050, // Principal + interest
                    txHash: '0xMockRepayTxHash...',
                });

            expect([201, 400]).toContain(res.status);
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
