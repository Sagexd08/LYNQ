import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollateralService } from './collateral.service';
import { CreateCollateralDto } from './dto/create-collateral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { CheckOwnership } from '../../common/decorators/resource-owner.decorator';

@ApiTags('Collateral')
@Controller('collateral')
export class CollateralController {
  constructor(private readonly service: CollateralService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(5, 60)
  @ApiOperation({ summary: 'Lock collateral for a loan' })
  async lockCollateral(@Request() req: any, @Body() dto: CreateCollateralDto) {
    return this.service.lockCollateral({ ...dto, userId: req.user.id });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(10, 60)
  @ApiOperation({ summary: 'List current user collateral (paginated)' })
  async listUserCollateral(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.service.listUserCollateral(req.user.id, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'collateral', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get collateral details by ID' })
  async getCollateralDetails(@Request() req: any, @Param('id') id: string) {
    
    return this.service.getCollateralDetails(id);
  }

  @Post(':id/unlock')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'collateral', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @Throttle(3, 60)
  @ApiOperation({ summary: 'Unlock collateral after loan repayment' })
  async unlockCollateral(@Request() req: any, @Param('id') id: string) {
    
    return this.service.unlockCollateral(id);
  }

  @Get(':id/value')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'collateral', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current collateral value' })
  async getCollateralValue(@Request() req: any, @Param('id') id: string) {
    
    return this.service.getCollateralValue(id);
  }
}
