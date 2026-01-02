import { Test, TestingModule } from '@nestjs/testing';
import { BlacklistService, BlacklistCheckResult, BlacklistEntry } from '../src/modules/compliance/blacklist.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../src/modules/supabase/supabase.service';

describe('BlacklistService', () => {
  let service: BlacklistService;
  let configService: jest.Mocked<ConfigService>;
  let supabaseService: jest.Mocked<SupabaseService>;

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
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'CHAINALYSIS_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<BlacklistService>(BlacklistService);
    configService = module.get(ConfigService);
    supabaseService = module.get(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe('checkAddress', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const testChain = 'evm';

    it('should return not blacklisted for clean address', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.checkAddress(testAddress, testChain);

      expect(result.isBlacklisted).toBe(false);
      expect(result.source).toBe('none');
    });

    it('should return blacklisted for internal blacklist match', async () => {
      const blacklistEntry = {
        address: testAddress.toLowerCase(),
        chain: testChain,
        reason: 'Fraud detected',
        source: 'internal',
        addedAt: new Date(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: blacklistEntry, error: null });

      const result = await service.checkAddress(testAddress, testChain);

      expect(result.isBlacklisted).toBe(true);
      expect(result.reason).toBe('Fraud detected');
      expect(result.source).toBe('internal');
    });

    it('should cache results', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      await service.checkAddress(testAddress, testChain);
      await service.checkAddress(testAddress, testChain);

      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);
    });

    it('should normalize address to lowercase', async () => {
      const upperCaseAddress = '0xABCDEF1234567890123456789012345678901234';
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      await service.checkAddress(upperCaseAddress, testChain);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('address', upperCaseAddress.toLowerCase());
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await service.checkAddress(testAddress, testChain);

      expect(result.isBlacklisted).toBe(false);
      expect(result.source).toBe('none');
    });
  });

  describe('addToBlacklist', () => {
    const entry: BlacklistEntry = {
      address: '0x1234567890123456789012345678901234567890',
      chain: 'evm',
      reason: 'Suspicious activity',
      source: 'internal',
      addedAt: new Date(),
      addedBy: 'admin',
    };

    it('should add address to blacklist', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: entry, error: null });

      await service.addToBlacklist(entry);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('blacklist');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should clear cache for added address', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: entry, error: null });

      await service.checkAddress(entry.address, entry.chain);
      await service.addToBlacklist(entry);

      const stats = service.getCacheStats();
      expect(stats.entries).not.toContain(`${entry.chain}:${entry.address.toLowerCase()}`);
    });

    it('should throw error on database failure', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Insert failed' } 
      });

      await expect(service.addToBlacklist(entry)).rejects.toThrow('Failed to add to blacklist');
    });
  });

  describe('removeFromBlacklist', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const testChain = 'evm';

    it('should remove address from blacklist', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({ data: null, error: null });

      await service.removeFromBlacklist(testAddress, testChain);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('blacklist');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should clear cache for removed address', async () => {
      const blacklistEntry = {
        address: testAddress.toLowerCase(),
        chain: testChain,
        reason: 'Test',
        source: 'internal',
        addedAt: new Date(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: blacklistEntry, error: null });
      mockSupabaseClient.eq.mockResolvedValueOnce({ data: null, error: null });

      await service.checkAddress(testAddress, testChain);
      await service.removeFromBlacklist(testAddress, testChain);

      const stats = service.getCacheStats();
      expect(stats.entries).not.toContain(`${testChain}:${testAddress.toLowerCase()}`);
    });

    it('should throw error on database failure', async () => {
      mockSupabaseClient.eq.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Delete failed' } 
      });

      await expect(service.removeFromBlacklist(testAddress, testChain)).rejects.toThrow('Failed to remove from blacklist');
    });
  });

  describe('getBlacklist', () => {
    it('should return all blacklist entries', async () => {
      const entries = [
        {
          address: '0x1111111111111111111111111111111111111111',
          chain: 'evm',
          reason: 'Fraud',
          source: 'internal',
          addedAt: new Date(),
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          chain: 'mantle',
          reason: 'OFAC',
          source: 'ofac',
          addedAt: new Date(),
        },
      ];
      mockSupabaseClient.order.mockResolvedValueOnce({ data: entries, error: null });

      const result = await service.getBlacklist();

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe(entries[0].address);
    });

    it('should throw error on database failure', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Fetch failed' } 
      });

      await expect(service.getBlacklist()).rejects.toThrow('Failed to fetch blacklist');
    });
  });

  describe('cache management', () => {
    it('should clear all cache entries', () => {
      service.clearCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      await service.checkAddress('0x1111111111111111111111111111111111111111', 'evm');
      await service.checkAddress('0x2222222222222222222222222222222222222222', 'mantle');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
    });
  });

  describe('OFAC sync', () => {
    it('should return placeholder result for OFAC sync', async () => {
      const result = await service.syncOFACSanctions();

      expect(result.added).toBe(0);
      expect(result.updated).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty address', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.checkAddress('', 'evm');

      expect(result.isBlacklisted).toBe(false);
    });

    it('should handle special characters in reason', async () => {
      const entry: BlacklistEntry = {
        address: '0x1234567890123456789012345678901234567890',
        chain: 'evm',
        reason: 'Test <script>alert("xss")</script>',
        source: 'internal',
        addedAt: new Date(),
      };
      mockSupabaseClient.single.mockResolvedValueOnce({ data: entry, error: null });

      await service.addToBlacklist(entry);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should handle concurrent requests for same address', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const promises = [
        service.checkAddress('0x1234567890123456789012345678901234567890', 'evm'),
        service.checkAddress('0x1234567890123456789012345678901234567890', 'evm'),
        service.checkAddress('0x1234567890123456789012345678901234567890', 'evm'),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.isBlacklisted).toBe(false);
      });
    });
  });
});
