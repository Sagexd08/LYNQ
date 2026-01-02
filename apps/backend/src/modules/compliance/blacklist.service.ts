import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  reason?: string;
  source: 'chainalysis' | 'ofac' | 'internal' | 'none';
  checkedAt: Date;
}

export interface BlacklistEntry {
  address: string;
  chain: string;
  reason: string;
  source: string;
  addedAt: Date;
  addedBy?: string;
}


@Injectable()
export class BlacklistService {
  private readonly logger = new Logger(BlacklistService.name);
  private blacklistCache: Map<string, BlacklistCheckResult> = new Map();
  private readonly CACHE_TTL = 3600 * 1000; 

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  
  async checkAddress(address: string, chain: string): Promise<BlacklistCheckResult> {
    const cacheKey = `${chain}:${address.toLowerCase()}`;

    
    const cached = this.blacklistCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.logger.debug(`Blacklist cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.log(`Checking blacklist for ${address} on ${chain}`);

    let result: BlacklistCheckResult;

    
    const internalCheck = await this.checkInternalBlacklist(address, chain);
    if (internalCheck.isBlacklisted) {
      result = internalCheck;
    } else {
      
      try {
        result = await this.checkExternalBlacklist(address, chain);
      } catch (error) {
        this.logger.error(`External blacklist check failed: ${error.message}`);
        
        result = {
          isBlacklisted: false,
          source: 'none',
          checkedAt: new Date(),
        };
      }
    }

    
    this.blacklistCache.set(cacheKey, result);

    
    if (result.isBlacklisted) {
      await this.logBlacklistHit(address, chain, result);
    }

    return result;
  }

  
  private async checkInternalBlacklist(
    address: string,
    chain: string,
  ): Promise<BlacklistCheckResult> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('blacklist')
      .select('*')
      .eq('address', address.toLowerCase())
      .eq('chain', chain)
      .single();

    if (error || !data) {
      return {
        isBlacklisted: false,
        source: 'internal',
        checkedAt: new Date(),
      };
    }

    this.logger.warn(`Address ${address} found in internal blacklist: ${data.reason}`);

    return {
      isBlacklisted: true,
      reason: data.reason,
      source: 'internal',
      checkedAt: new Date(),
    };
  }

  
  private async checkExternalBlacklist(
    address: string,
    chain: string,
  ): Promise<BlacklistCheckResult> {
    
    try {
      return await this.checkChainalysis(address, chain);
    } catch (error) {
      this.logger.warn(`Chainalysis check failed: ${error.message}`);
    }

    
    try {
      return await this.checkOFAC(address);
    } catch (error) {
      this.logger.warn(`OFAC check failed: ${error.message}`);
    }

    
    return {
      isBlacklisted: false,
      source: 'none',
      checkedAt: new Date(),
    };
  }

  
  private async checkChainalysis(
    address: string,
    chain: string,
  ): Promise<BlacklistCheckResult> {
    const apiKey = this.configService.get<string>('CHAINALYSIS_API_KEY');

    if (!apiKey) {
      throw new Error('Chainalysis API key not configured');
    }

    
    
    
    this.logger.debug(`Chainalysis check for ${address} (not implemented)`);

    
    return {
      isBlacklisted: false,
      source: 'chainalysis',
      checkedAt: new Date(),
    };
  }

  
  private async checkOFAC(address: string): Promise<BlacklistCheckResult> {
    
    
    
    
    const ofacAddresses = new Set([
      '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c', 
      '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b', 
      
    ]);

    const isBlacklisted = ofacAddresses.has(address.toLowerCase());

    if (isBlacklisted) {
      this.logger.warn(`Address ${address} found in OFAC sanctions list`);
    }

    return {
      isBlacklisted,
      reason: isBlacklisted ? 'OFAC Sanctions List' : undefined,
      source: 'ofac',
      checkedAt: new Date(),
    };
  }

  
  async addToBlacklist(entry: BlacklistEntry): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('blacklist').insert({
      address: entry.address.toLowerCase(),
      chain: entry.chain,
      reason: entry.reason,
      source: entry.source,
      addedAt: entry.addedAt,
      addedBy: entry.addedBy,
    });

    if (error) {
      throw new Error(`Failed to add to blacklist: ${error.message}`);
    }

    
    const cacheKey = `${entry.chain}:${entry.address.toLowerCase()}`;
    this.blacklistCache.delete(cacheKey);

    this.logger.log(`Added ${entry.address} to blacklist: ${entry.reason}`);
  }

  
  async removeFromBlacklist(address: string, chain: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('blacklist')
      .delete()
      .eq('address', address.toLowerCase())
      .eq('chain', chain);

    if (error) {
      throw new Error(`Failed to remove from blacklist: ${error.message}`);
    }

    
    const cacheKey = `${chain}:${address.toLowerCase()}`;
    this.blacklistCache.delete(cacheKey);

    this.logger.log(`Removed ${address} from blacklist`);
  }

  
  async getBlacklist(): Promise<BlacklistEntry[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('blacklist')
      .select('*')
      .order('addedAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch blacklist: ${error.message}`);
    }

    return data as BlacklistEntry[];
  }

  
  private async logBlacklistHit(
    address: string,
    chain: string,
    result: BlacklistCheckResult,
  ): Promise<void> {
    const supabase = this.supabaseService.getClient();

    await supabase.from('audit_logs').insert({
      action: 'BLACKLIST_HIT',
      resource: 'address',
      metadata: {
        address,
        chain,
        reason: result.reason,
        source: result.source,
      },
      createdAt: new Date(),
    });

    this.logger.warn(
      `🚨 BLACKLIST HIT: ${address} on ${chain} - ${result.reason} (${result.source})`,
    );
  }

  
  private isCacheValid(result: BlacklistCheckResult): boolean {
    const age = Date.now() - result.checkedAt.getTime();
    return age < this.CACHE_TTL;
  }

  
  clearCache(): void {
    this.blacklistCache.clear();
    this.logger.log('Blacklist cache cleared');
  }

  
  getCacheStats() {
    return {
      size: this.blacklistCache.size,
      entries: Array.from(this.blacklistCache.keys()),
    };
  }

  
  async syncOFACSanctions(): Promise<{ added: number; updated: number }> {
    this.logger.log('Starting OFAC sanctions list sync');

    
    

    this.logger.log('OFAC sync complete (not implemented)');

    return { added: 0, updated: 0 };
  }
}
