import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CollateralService } from './collateral.service';
import { CreateCollateralDto } from './dto/create-collateral.dto';

@Controller('collateral')
export class CollateralController {
  constructor(private readonly service: CollateralService) {}

  @Post()
  async lockCollateral(@Body() dto: CreateCollateralDto) {
    return this.service.lockCollateral(dto as any);
  }

  @Get()
  async listUserCollateral() {
    return this.service.listUserCollateral();
  }

  @Get(':id')
  async getCollateralDetails(@Param('id') id: string) {
    return this.service.getCollateralDetails(id);
  }

  @Post(':id/unlock')
  async unlockCollateral(@Param('id') id: string) {
    return this.service.unlockCollateral(id);
  }

  @Get(':id/value')
  async getCollateralValue(@Param('id') id: string) {
    return this.service.getCollateralValue(id);
  }
}
