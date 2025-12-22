import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Collateral } from './entities/collateral.entity';

@Injectable()
@Injectable()
export class CollateralService {
  constructor(private readonly supabaseService: SupabaseService) { }

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async lockCollateral(dto: Partial<Collateral>) {
    const { data, error } = await this.supabase
      .from('collateral')
      .insert({ ...dto, status: 'LOCKED' })
      .select()
      .single();

    if (error) throw new Error(`Lock collateral failed: ${error.message}`);
    return data as Collateral;
  }

  async listUserCollateral(): Promise<Collateral[]> {
    const { data, error } = await this.supabase
      .from('collateral')
      .select('*');
    if (error) return [];
    return data as Collateral[];
  }

  async getCollateralDetails(id: string) {
    const { data } = await this.supabase
      .from('collateral')
      .select('*')
      .eq('id', id)
      .single();
    return data as Collateral;
  }

  async unlockCollateral(id: string) {
    await this.supabase
      .from('collateral')
      .update({ status: 'UNLOCKED' })
      .eq('id', id);
    return this.getCollateralDetails(id);
  }

  async getCollateralValue(id: string) {
    // Placeholder - in real implementation call price oracle/chain
    const entity = await this.getCollateralDetails(id);
    return { id, value: entity?.lastValuation ? Number(entity.lastValuation) : 1000 };
  }
}
