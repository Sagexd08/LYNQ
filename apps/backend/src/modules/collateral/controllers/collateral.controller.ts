import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CollateralService } from '../services/collateral.service';
import { LockCollateralDto } from '../dto/lock-collateral.dto';
import { UnlockCollateralDto } from '../dto/unlock-collateral.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Collateral')
@Controller('collateral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollateralController {
  constructor(private readonly collateralService: CollateralService) {}

  @Post('lock')
  @ApiOperation({ summary: 'Lock collateral for loan' })
  async lockCollateral(@Request() req: any, @Body() lockCollateralDto: LockCollateralDto): Promise<any> {
    return this.collateralService.lock(req.user.id, lockCollateralDto);
  }

  @Put(':id/unlock')
  @ApiOperation({ summary: 'Unlock collateral' })
  async unlockCollateral(@Param('id') id: string, @Body() unlockCollateralDto: UnlockCollateralDto): Promise<any> {
    return this.collateralService.unlock(id, unlockCollateralDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user collaterals' })
  async getUserCollaterals(@Request() req: any): Promise<any> {
    return this.collateralService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collateral by ID' })
  async getCollateralById(@Param('id') id: string): Promise<any> {
    return this.collateralService.findById(id);
  }

  @Get(':id/value')
  @ApiOperation({ summary: 'Get current collateral value' })
  async getCollateralValue(@Param('id') id: string): Promise<any> {
    return this.collateralService.getCurrentValue(id);
  }
}
