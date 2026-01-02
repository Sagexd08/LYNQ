
import { Test, TestingModule } from '@nestjs/testing';
import { LoanService } from '../src/modules/loan/services/loan.service';
import { MLService } from '../src/modules/ml/ml.service';
import { UserService } from '../src/modules/user/services/user.service';
import { TelegramService } from '../src/modules/telegram/services/telegram.service';
import { Loan, LoanStatus } from '../src/modules/loan/entities/loan.entity';
import { User } from '../src/modules/user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

describe('Loan Flow E2E (Simulated)', () => {
    let loanService: LoanService;
    let mlService: MLService;
    let mockLoanRepo;
    let mockUserRepo;

    beforeEach(async () => {
        mockLoanRepo = {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((loan) => Promise.resolve({ ...loan, id: 'loan-123' })),
            find: jest.fn(),
            findOne: jest.fn(),
        };

        mockUserRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoanService,
                MLService,
                UserService,
                {
                    provide: getRepositoryToken(Loan),
                    useValue: mockLoanRepo,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
                {
                    provide: TelegramService,
                    useValue: { notifyLoanCreated: jest.fn() },
                },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn() },
                },
            ],
        }).compile();

        loanService = module.get<LoanService>(LoanService);
        mlService = module.get<MLService>(MLService);
    });

    it('should calculate risk, check eligibility, and create a loan', async () => {
        
        const userId = 'user-1';
        const user = {
            id: userId,
            reputationTier: 'GOLD',
            reputationPoints: 600,
            walletAddresses: { mantleSepolia: '0x123' },
            createdAt: new Date('2023-01-01'),
        };
        mockUserRepo.findOne.mockResolvedValue(user);

        
        
        
        jest.spyOn(mlService, 'calculateUserCreditScore').mockResolvedValue({
            score: 750,
            grade: 'A',
            breakdown: {} as any
        });

        
        const createLoanDto = {
            amount: '1000',
            collateralAmount: '2', 
            collateralTokenAddress: '0xCollateral',
            durationDays: 30,
            chain: 'mantleSepolia',
            transactionHash: '0xTxHash',
        };

        
        const result = await loanService.create(userId, createLoanDto);

        
        expect(result).toBeDefined();
        expect(result.amount).toBe('1000');
        expect(result.status).toBe(LoanStatus.ACTIVE);

        
        
        
    });
});
