import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RiskService } from './risk.service';
import { RiskEvaluationDto } from './dto/risk-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Risk')
@Controller('risk')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate loan risk' })
  @ApiResponse({ status: 200, description: 'Risk evaluation completed' })
  async evaluateRisk(@Body() dto: RiskEvaluationDto) {
    return this.riskService.evaluateLoanRisk(dto);
  }

  @Get(':loanId')
  @ApiOperation({ summary: 'Get risk assessment for a loan' })
  @ApiResponse({ status: 200, description: 'Risk assessment retrieved' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getRiskAssessment(@Param('loanId') loanId: string) {
    return this.riskService.getRiskAssessment(loanId);
  }
}
