import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollateralService } from './collateral.service';
import { LockCollateralDto, UnlockCollateralDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Collateral')
@Controller('collateral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollateralController {
    constructor(private readonly collateralService: CollateralService) { }

    @Post('lock')
    @ApiOperation({ summary: 'Lock collateral for a loan' })
    @ApiResponse({ status: 201, description: 'Collateral locked successfully' })
    async lockCollateral(@Body() dto: LockCollateralDto) {
        return this.collateralService.lockCollateral(dto);
    }

    @Post('unlock')
    @ApiOperation({ summary: 'Unlock collateral for a repaid loan' })
    @ApiResponse({ status: 200, description: 'Collateral unlocked successfully' })
    async unlockCollateral(@Body() dto: UnlockCollateralDto) {
        return this.collateralService.unlockCollateral(dto);
    }

    @Get('loan/:loanId')
    @ApiOperation({ summary: 'Get collateral for a loan' })
    @ApiResponse({ status: 200, description: 'Collateral retrieved successfully' })
    async getCollateralByLoan(@Param('loanId') loanId: string) {
        return this.collateralService.getCollateralByLoan(loanId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get collateral by ID' })
    @ApiResponse({ status: 200, description: 'Collateral retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Collateral not found' })
    async getCollateralById(@Param('id') id: string) {
        return this.collateralService.getCollateralById(id);
    }

    @Get('loan/:loanId/value')
    @ApiOperation({ summary: 'Get total collateral value for a loan' })
    @ApiResponse({ status: 200, description: 'Total value calculated' })
    async getTotalValue(@Param('loanId') loanId: string) {
        const totalValue = await this.collateralService.getTotalCollateralValue(loanId);
        return { loanId, totalValueUsd: totalValue };
    }
}
