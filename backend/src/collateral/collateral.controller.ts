import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CollateralService } from './collateral.service';
import { LockCollateralDto, UnlockCollateralDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Collateral')
@Controller('collateral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollateralController {
  constructor(private readonly collateralService: CollateralService) {}

  @Post('lock')
  @ApiOperation({ summary: 'Lock collateral for a loan' })
  @ApiResponse({ status: 201, description: 'Collateral locked successfully' })
  async lockCollateral(@Body() dto: LockCollateralDto, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.collateralService.lockCollateral(dto, userId);
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Unlock collateral for a repaid loan' })
  @ApiResponse({ status: 200, description: 'Collateral unlocked successfully' })
  async unlockCollateral(
    @Body() dto: UnlockCollateralDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    return this.collateralService.unlockCollateral(dto, userId);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get collateral for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Collateral retrieved successfully',
  })
  async getCollateralByUser(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    return this.collateralService.getCollateralByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collateral by ID' })
  @ApiResponse({
    status: 200,
    description: 'Collateral retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Collateral not found' })
  async getCollateralById(@Param('id') id: string) {
    return this.collateralService.getCollateralById(id);
  }

  @Get('value/total')
  @ApiOperation({ summary: 'Get total collateral value for the current user' })
  @ApiResponse({ status: 200, description: 'Total value calculated' })
  async getTotalValue(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    const totalValue =
      await this.collateralService.getTotalCollateralValue(userId);
    return { userId, totalValueUsd: totalValue };
  }
}
