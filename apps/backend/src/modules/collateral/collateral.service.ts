import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Collateral } from '../../common/types/database.types';
import { OracleService } from '../oracle/oracle.service';

@Injectable()
export class CollateralService {
  private readonly logger = new Logger(CollateralService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    @Inject(forwardRef(() => OracleService))
    private readonly oracleService: OracleService,
  ) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async lockCollateral(dto: Partial<Collateral>): Promise<Collateral> {
    this.logger.log(`Locking collateral for user ${dto.userId}`);

    const { data, error } = await this.supabase
      .from('collateral')
      .insert({ ...dto, status: 'LOCKED' })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to lock collateral: ${error.message}`, error.stack);
      throw new Error(`Lock collateral failed: ${error.message}`);
    }

    this.logger.log(`Collateral locked successfully: ${data.id}`);
    return data as Collateral;
  }

  async listUserCollateral(userId: string, page: number = 1, limit: number = 20): Promise<{ data: Collateral[]; count: number }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('collateral')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch collateral: ${error.message}`);
    }

    return { data: data as Collateral[], count: count || 0 };
  }

  
  async listAllCollateral(): Promise<Collateral[]> {
    const { data, error } = await this.supabase
      .from('collateral')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch all collateral: ${error.message}`);
    }

    return data as Collateral[];
  }

  async getCollateralDetails(id: string): Promise<Collateral> {
    if (!id) {
      throw new BadRequestException('Collateral ID is required');
    }

    const { data, error } = await this.supabase
      .from('collateral')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Collateral ${id} not found`);
    }

    return data as Collateral;
  }

  async unlockCollateral(id: string): Promise<Collateral> {
    if (!id) {
      throw new BadRequestException('Collateral ID is required');
    }

    const { data, error } = await this.supabase
      .from('collateral')
      .update({ status: 'UNLOCKED' })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to unlock collateral: ${error?.message}`);
    }

    return data as Collateral;
  }

  async getCollateralValue(id: string, chain: string = 'ethereum'): Promise<{ id: string; value: number; source: string }> {
    const entity = await this.getCollateralDetails(id);

    try {
      
      
      const valuation = await this.oracleService.getTokenValuation(
        entity.tokenAddress,
        entity.amount,
        chain,
      );

      this.logger.log(
        `Collateral ${id} valued at $${valuation.valueUSD.toFixed(2)} ` +
        `(${entity.amount} tokens @ $${valuation.pricePerToken.toFixed(2)} each) on ${chain}`
      );

      
      await this.supabase
        .from('collateral')
        .update({
          lastValuation: valuation.valueUSD.toString(),
          lastValuationAt: new Date().toISOString(),
        })
        .eq('id', id);

      return {
        id,
        value: valuation.valueUSD,
        source: 'oracle',
      };
    } catch (error) {
      this.logger.error(`Failed to get oracle price for collateral ${id}: ${error.message}`);

      
      if (entity.lastValuation) {
        this.logger.warn(`Using cached valuation for collateral ${id}`);
        return {
          id,
          value: Number(entity.lastValuation),
          source: 'cached',
        };
      }

      
      throw new BadRequestException(
        'Unable to determine collateral value. Oracle unavailable and no cached valuation exists.'
      );
    }
  }

  
  async updateAllValuations(): Promise<{ updated: number; failed: number }> {
    this.logger.log('Starting batch collateral valuation update');

    const activeCollateral = await this.supabase
      .from('collateral')
      .select('*')
      .eq('status', 'LOCKED');

    if (activeCollateral.error || !activeCollateral.data) {
      throw new Error('Failed to fetch active collateral');
    }

    let updated = 0;
    let failed = 0;

    for (const collateral of activeCollateral.data) {
      try {
        await this.getCollateralValue(collateral.id);
        updated++;
      } catch (error) {
        this.logger.error(`Failed to update valuation for ${collateral.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Valuation update complete: ${updated} updated, ${failed} failed`);

    return { updated, failed };
  }
}
