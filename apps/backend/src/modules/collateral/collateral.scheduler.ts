import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CollateralService } from './collateral.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CollateralScheduler {
  private readonly logger = new Logger(CollateralScheduler.name);

  constructor(private readonly collateralService: CollateralService, private readonly audit: AuditService) { }

  @Cron('*/1 * * * *') 
  async checkCollateralValuations() {
    this.logger.debug('Running collateral valuation job');
    try {
      const items = await this.collateralService.listAllCollateral();
      for (const c of items) {
        
        const valuation = await this.collateralService.getCollateralValue(c.id);
        
        const value = (valuation?.value ?? 0) as number;
        if (value <= 0) continue;
        
        if (value < 1) {
          this.logger.warn(`Collateral ${c.id} flagged for liquidation (value=${value})`);
          await this.audit.record({ action: 'LIQUIDATION_ALERT', resource: `collateral:${c.id}`, userId: c.userId, metadata: { value } });
        }
      }
    } catch (err) {
      this.logger.error('Collateral scheduler failed', err as any);
    }
  }
}
