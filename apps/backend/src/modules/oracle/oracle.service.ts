import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { DecimalUtil } from '../../common/utils/decimal.util';

export interface PriceFeed {
  tokenAddress: string;
  chain: string;
  price: string;
  decimals: number;
  timestamp: Date;
  source: 'chainlink' | 'pyth' | 'uniswap' | 'fallback';
}

export interface TokenValuation {
  tokenAddress: string;
  amount: string;
  valueUSD: string;
  pricePerToken: string;
  timestamp: Date;
}

interface PythPriceFeed {
  price: {
    price: string;
    expo: number;
  };
  last_updated_slot: string;
}

interface PythResponse {
  price_feeds?: PythPriceFeed[];
}

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);
  private priceCache: Map<string, PriceFeed> = new Map();
  private readonly CACHE_TTL = 60 * 1000;

  constructor(private readonly configService: ConfigService) {}

  async getPrice(tokenAddress: string, chain: string): Promise<PriceFeed> {
    const cacheKey = `${chain}:${tokenAddress.toLowerCase()}`;
    
    const cached = this.priceCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Fetching price for ${tokenAddress} on ${chain}`);

    let priceFeed: PriceFeed;

    try {
      priceFeed = await this.getChainlinkPrice(tokenAddress, chain);
    } catch (error) {
      this.logger.warn(`Chainlink price fetch failed: ${error.message}`);
      
      try {
        priceFeed = await this.getPythPrice(tokenAddress, chain);
      } catch (pythError) {
        this.logger.warn(`Pyth price fetch failed: ${pythError.message}`);
        priceFeed = this.getFallbackPrice(tokenAddress, chain);
      }
    }

    this.priceCache.set(cacheKey, priceFeed);

    return priceFeed;
  }

  async getTokenValuation(
    tokenAddress: string,
    amount: string,
    chain: string,
  ): Promise<TokenValuation> {
    const priceFeed = await this.getPrice(tokenAddress, chain);
    
    const tokenAmount = DecimalUtil.fromString(amount);
    const priceDecimal = DecimalUtil.fromString(priceFeed.price);
    const valueUSD = DecimalUtil.multiply(tokenAmount, priceDecimal);

    return {
      tokenAddress,
      amount,
      valueUSD: DecimalUtil.toFixed(valueUSD, 8),
      pricePerToken: priceFeed.price,
      timestamp: new Date(),
    };
  }

  private async getChainlinkPrice(
    tokenAddress: string,
    chain: string,
  ): Promise<PriceFeed> {
    const chainlinkFeeds: Record<string, Record<string, string>> = {
      ethereum: {
        '0x0000000000000000000000000000000000000000': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
        '0xdAC17F958D2ee523a2206206994597C13D831ec7': '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      },
      polygon: {
        '0x0000000000000000000000000000000000001010': '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0',
      },
      arbitrum: {
        '0x0000000000000000000000000000000000000000': '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
      },
    };

    const feedAddress = chainlinkFeeds[chain]?.[tokenAddress.toLowerCase()];

    if (!feedAddress) {
      throw new Error(`No Chainlink feed found for ${tokenAddress} on ${chain}`);
    }

    const aggregatorABI = [
      'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
      'function decimals() external view returns (uint8)',
    ];

    const rpcUrl = this.getRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const aggregator = new ethers.Contract(feedAddress, aggregatorABI, provider);

    const [roundData, decimals] = await Promise.all([
      aggregator.latestRoundData(),
      aggregator.decimals(),
    ]);

    const answerDecimal = DecimalUtil.fromString(roundData.answer.toString());
    const divisor = DecimalUtil.fromNumber(Math.pow(10, Number(decimals)));
    const price = DecimalUtil.divide(answerDecimal, divisor);

    this.logger.log(`Chainlink price for ${tokenAddress}: $${DecimalUtil.toFixed(price, 2)}`);

    return {
      tokenAddress,
      chain,
      price: DecimalUtil.toFixed(price, 8),
      decimals: Number(decimals),
      timestamp: new Date(Number(roundData.updatedAt) * 1000),
      source: 'chainlink',
    };
  }

  private async getPythPrice(
    tokenAddress: string,
    chain: string,
  ): Promise<PriceFeed> {
    const pythFeedIds: Record<string, Record<string, string>> = {
      ethereum: {
        '0x0000000000000000000000000000000000000000': 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      },
      aptos: {
        '0x1::aptos_coin::AptosCoin': 'e8b5e1e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8',
      },

    };

    const feedId = pythFeedIds[chain]?.[tokenAddress.toLowerCase()];

    if (!feedId) {
      throw new Error(`No Pyth feed found for ${tokenAddress} on ${chain}`);
    }

    try {
      const response = await fetch(`https://hermes.pyth.network/api/latest_price_feeds?ids[]=${feedId}`);
      
      if (!response.ok) {
        this.logger.warn(`Pyth API error: ${response.statusText}`);
        throw new Error(`Pyth API responded with ${response.status}`);
      }

      const data = await response.json() as PythResponse;
      
      if (!data.price_feeds || data.price_feeds.length === 0) {
        throw new Error(`No price data found for feed ${feedId}`);
      }

      const priceFeedData = data.price_feeds[0];
      
      const priceRaw = DecimalUtil.fromString(priceFeedData.price.price);
      const exponent = Number(priceFeedData.price.expo);
      const multiplier = DecimalUtil.fromNumber(Math.pow(10, exponent));
      const price = DecimalUtil.multiply(priceRaw, multiplier);
      const decimals = Math.abs(exponent);

      this.logger.log(`Pyth price for ${tokenAddress}: $${DecimalUtil.toFixed(price, 2)}`);

      return {
        tokenAddress,
        chain,
        price: DecimalUtil.toFixed(price, 8),
        decimals,
        timestamp: new Date(Number(priceFeedData.last_updated_slot) * 1000),
        source: 'pyth',
      };
    } catch (error) {
      this.logger.error(`Pyth price fetch failed: ${error.message}`);
      throw error;
    }
  }

  private getFallbackPrice(tokenAddress: string, chain: string): PriceFeed {
    this.logger.warn(`Using fallback price for ${tokenAddress} on ${chain}`);

    const fallbackPrices: Record<string, string> = {
      '0x0000000000000000000000000000000000000000': '2000',
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': '2000',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': '1',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': '1',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': '30000',
      'default': '1000',
    };

    const price = fallbackPrices[tokenAddress.toLowerCase()] || fallbackPrices['default'];

    return {
      tokenAddress,
      chain,
      price,
      decimals: 18,
      timestamp: new Date(),
      source: 'fallback',
    };
  }

  private isCacheValid(priceFeed: PriceFeed): boolean {
    const age = Date.now() - priceFeed.timestamp.getTime();
    return age < this.CACHE_TTL;
  }

  private getRpcUrl(chain: string): string {
    const rpcUrls: Record<string, string> = {
      ethereum: this.configService.get('RPC_URL', 'https://eth.llamarpc.com'),
      polygon: 'https://polygon-rpc.com',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      optimism: 'https://mainnet.optimism.io',
      base: 'https://mainnet.base.org',
      mantle: 'https://rpc.mantle.xyz',
      mantleSepolia: 'https://rpc.sepolia.mantle.xyz',
    };

    return rpcUrls[chain] || rpcUrls.ethereum;
  }

  clearCache() {
    this.priceCache.clear();
    this.logger.log('Price cache cleared');
  }

  getCacheStats() {
    return {
      size: this.priceCache.size,
      entries: Array.from(this.priceCache.keys()),
    };
  }
}
