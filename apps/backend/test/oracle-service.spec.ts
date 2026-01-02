
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OracleService } from '../src/modules/oracle/oracle.service';
describe('OracleService', () => {
  let service: OracleService;
  let configService: ConfigService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OracleService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                RPC_URL: 'http://localhost:8545',
                CHAINALYSIS_API_KEY: undefined,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();
    service = module.get<OracleService>(OracleService);
    configService = module.get<ConfigService>(ConfigService);
  });
  afterEach(() => {
    service.clearCache();
  });
  describe('getPrice', () => {
    it('should return price feed for ETH', async () => {
      const result = await service.getPrice(
        '0x0000000000000000000000000000000000000000',
        'ethereum'
      );
      expect(result).toBeDefined();
      expect(result.tokenAddress).toBe('0x0000000000000000000000000000000000000000');
      expect(result.chain).toBe('ethereum');
      expect(result.price).toBeGreaterThan(0);
      expect(result.source).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
    it('should return price feed for WETH', async () => {
      const result = await service.getPrice(
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        'ethereum'
      );
      expect(result.price).toBeGreaterThan(0);
      expect(result.source).toBe('fallback'); 
    });
    it('should return price feed for USDC', async () => {
      const result = await service.getPrice(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        'ethereum'
      );
      expect(result.price).toBe(1); 
    });
    it('should handle unknown tokens with default price', async () => {
      const result = await service.getPrice(
        '0x1111111111111111111111111111111111111111',
        'ethereum'
      );
      expect(result.price).toBe(1000); 
      expect(result.source).toBe('fallback');
    });
  });
  describe('Cache Functionality', () => {
    it('should cache price feeds', async () => {
      const address = '0x0000000000000000000000000000000000000000';
      const result1 = await service.getPrice(address, 'ethereum');
      const result2 = await service.getPrice(address, 'ethereum');
      expect(result1.timestamp).toEqual(result2.timestamp);
      expect(service.getCacheStats().size).toBeGreaterThan(0);
    });
    it('should clear cache when requested', async () => {
      await service.getPrice('0x0000000000000000000000000000000000000000', 'ethereum');
      expect(service.getCacheStats().size).toBeGreaterThan(0);
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
    it('should respect cache TTL', async () => {
      const address = '0x0000000000000000000000000000000000000000';
      const result1 = await service.getPrice(address, 'ethereum');
      await new Promise(resolve => setTimeout(resolve, 61000)); 
      const result2 = await service.getPrice(address, 'ethereum');
      expect(result1.timestamp.getTime()).not.toBe(result2.timestamp.getTime());
    }, 65000);
  });
  describe('getTokenValuation', () => {
    it('should calculate USD value correctly', async () => {
      const result = await service.getTokenValuation(
        '0x0000000000000000000000000000000000000000',
        '1.5',
        'ethereum'
      );
      expect(result.tokenAddress).toBe('0x0000000000000000000000000000000000000000');
      expect(result.amount).toBe('1.5');
      expect(result.valueUSD).toBeGreaterThan(0);
      expect(result.pricePerToken).toBeGreaterThan(0);
      expect(result.valueUSD).toBe(1.5 * (result.pricePerToken as unknown as number));
    });
    it('should handle large amounts', async () => {
      const result = await service.getTokenValuation(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 
        '1000000',
        'ethereum'
      );
      expect(result.valueUSD).toBe(1000000); 
    });
    it('should handle decimal amounts', async () => {
      const result = await service.getTokenValuation(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0.5',
        'ethereum'
      );
      expect(result.valueUSD).toBe(0.5);
    });
  });
  describe('Multi-chain Support', () => {
    it('should support Ethereum', async () => {
      const result = await service.getPrice(
        '0x0000000000000000000000000000000000000000',
        'ethereum'
      );
      expect(result.chain).toBe('ethereum');
    });
    it('should support Polygon', async () => {
      const result = await service.getPrice(
        '0x0000000000000000000000000000000000001010',
        'polygon'
      );
      expect(result.chain).toBe('polygon');
    });
    it('should support Arbitrum', async () => {
      const result = await service.getPrice(
        '0x0000000000000000000000000000000000000000',
        'arbitrum'
      );
      expect(result.chain).toBe('arbitrum');
    });
    it('should default to Ethereum for unknown chains', async () => {
      const result = await service.getPrice(
        '0x0000000000000000000000000000000000000000',
        'unknown-chain'
      );
      expect(result).toBeDefined();
    });
  });
  describe('Error Handling', () => {
    it('should handle invalid addresses gracefully', async () => {
      const result = await service.getPrice('invalid-address', 'ethereum');
      expect(result).toBeDefined();
      expect(result.source).toBe('fallback');
    });
    it('should handle empty addresses', async () => {
      const result = await service.getPrice('', 'ethereum');
      expect(result).toBeDefined();
    });
  });
  describe('Cache Statistics', () => {
    it('should provide cache statistics', async () => {
      await service.getPrice('0x0000000000000000000000000000000000000000', 'ethereum');
      await service.getPrice('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'ethereum');
      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries).toContain('ethereum:0x0000000000000000000000000000000000000000');
    });
  });
});
