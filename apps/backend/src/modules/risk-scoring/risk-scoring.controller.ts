import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RiskScoringService } from './risk-scoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Risk Scoring')
@Controller('risk-scoring')
export class RiskScoringController {
  constructor(private readonly riskService: RiskScoringService) { }

  @Get('score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user algorithmic credit score' })
  async getScore(@Request() req: any) {
    return this.riskService.calculateUserCreditScore(req.user.id);
  }
}
