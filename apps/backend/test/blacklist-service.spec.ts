
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlacklistService } from '../src/modules/compliance/blacklist.service';
import { SupabaseService } from '../src/modules/supabase/supabase.service';
describe('BlacklistService', () => {
  let service: BlacklistService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlacklistService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'CHAINALYSIS_API_KEY') return undefined;
              return undefined;
            }),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(() => mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<BlacklistService>(BlacklistService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    service.clearCache();
    jest.clearAllMocks();
  });

  describe('checkAddress', () => {
    it('should return not blacklisted for clean address', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await service.checkAddress(
        '0x1234567890123456789012345678901234567890',
        'ethereum'
      );

      expect(result.isBlacklisted).toBe(false);
      expect(result.source).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);
    });

    it('should return blacklisted for sanctioned address', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          address: '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c',
          chain: 'ethereum',
          reason: 'OFAC Sanctions',
          source: 'internal',
        },
        error: null,
      });

      const result = await service.checkAddress(
        '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c',
        'ethereum'
      );

      expect(result.isBlacklisted).toBe(true);
      expect(result.reason).toBe('OFAC Sanctions');
      expect(result.source).toBe('internal');
    });

    it('should check Tornado Cash addresses', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const tornadoCashAddress = '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c';
      const result = await service.checkAddress(tornadoCashAddress, 'ethereum');

      
      expect(result).toBeDefined();
    });

    it('should handle case-insensitive addresses', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result1 = await service.checkAddress(
        '0xABCDEF1234567890123456789012345678901234',
        'ethereum'
      );
      const result2 = await service.checkAddress(
        '0xabcdef1234567890123456789012345678901234',
        'ethereum'
      );

      expect(result1.isBlacklisted).toBe(result2.isBlacklisted);
    });
  });

  describe('Cache Functionality', () => {
    it('should cache blacklist check results', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const address = '0x1234567890123456789012345678901234567890';
      
      await service.checkAddress(address, 'ethereum');
      await service.checkAddress(address, 'ethereum');

      
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
    });

    it('should provide cache statistics', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await service.checkAddress('0x1111111111111111111111111111111111111111', 'ethereum');
      await service.checkAddress('0x2222222222222222222222222222222222222222', 'ethereum');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
    });

    it('should clear cache when requested', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await service.checkAddress('0x1111111111111111111111111111111111111111', 'ethereum');
      
      expect(service.getCacheStats().size).toBe(1);
      
      service.clearCache();
      
      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('addToBlacklist', () => {
    it('should add address to blacklist', async () => {
      mockSupabaseClient.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.addToBlacklist({
        address: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        reason: 'Suspicious activity',
        source: 'internal',
        addedAt: new Date(),
        addedBy: 'admin',
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('blacklist');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should clear cache after adding to blacklist', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      mockSupabaseClient.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const address = '0x1234567890123456789012345678901234567890';
      
      
      await service.checkAddress(address, 'ethereum');
      expect(service.getCacheStats().size).toBe(1);

      
      await service.addToBlacklist({
        address,
        chain: 'ethereum',
        reason: 'Test',
        source: 'internal',
        addedAt: new Date(),
      });

      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('removeFromBlacklist', () => {
    it('should remove address from blacklist', async () => {
      mockSupabaseClient.delete.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.removeFromBlacklist(
        '0x1234567890123456789012345678901234567890',
        'ethereum'
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('blacklist');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should clear cache after removing from blacklist', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { address: '0x1234', chain: 'ethereum', reason: 'Test' },
        error: null,
      });
      mockSupabaseClient.delete.mockResolvedValue({
        data: null,
        error: null,
      });

      const address = '0x1234567890123456789012345678901234567890';
      
      await service.checkAddress(address, 'ethereum');
      expect(service.getCacheStats().size).toBe(1);

      await service.removeFromBlacklist(address, 'ethereum');
      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('Multi-chain Support', () => {
    it('should support Ethereum addresses', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await service.checkAddress(
        '0x1234567890123456789012345678901234567890',
        'ethereum'
      );

      expect(result).toBeDefined();
    });

    it('should support Polygon addresses', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await service.checkAddress(
        '0x1234567890123456789012345678901234567890',
        'polygon'
      );

      expect(result).toBeDefined();
    });

    it('should support Arbitrum addresses', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await service.checkAddress(
        '0x1234567890123456789012345678901234567890',
        'arbitrum'
      );

      expect(result).toBeDefined();
    });

    it('should handle different addresses on different chains', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const address = '0x1234567890123456789012345678901234567890';
      
      await service.checkAddress(address, 'ethereum');
      await service.checkAddress(address, 'polygon');

      
      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await service.checkAddress(
        '0x1234567890123456789012345678901234567890',
        'ethereum'
      );

      expect(result.isBlacklisted).toBe(false);
    });

    it('should handle invalid addresses', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await service.checkAddress('invalid-address', 'ethereum');

      expect(result).toBeDefined();
    });
  });

  describe('getBlacklist', () => {
    it('should return all blacklisted addresses', async () => {
      const mockBlacklist = [
        {
          address: '0x1111111111111111111111111111111111111111',
          chain: 'ethereum',
          reason: 'OFAC',
          source: 'internal',
          addedAt: new Date(),
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          chain: 'polygon',
          reason: 'Fraud',
          source: 'internal',
          addedAt: new Date(),
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockBlacklist,
        error: null,
      });

      const result = await service.getBlacklist();

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe('0x1111111111111111111111111111111111111111');
    });

    it('should handle empty blacklist', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getBlacklist();

      expect(result).toHaveLength(0);
    });
  });
});
