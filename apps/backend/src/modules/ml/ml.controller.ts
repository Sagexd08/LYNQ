import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MLService } from './ml.service';

@ApiTags('ML')
@Controller('ml')
export class MLController {
  private readonly logger = new Logger(MLController.name);

  constructor(private readonly mlService: MLService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get ML service status' })
  @ApiResponse({ status: 200, description: 'ML service status' })
  async getStatus() {
    return this.mlService.getModelStatus();
  }

  @Post('assess-risk')
  @ApiOperation({ summary: 'Assess credit risk for a loan application' })
  @ApiResponse({ status: 200, description: 'Risk assessment result' })
  async assessRisk(@Body() body: any) {
    this.logger.log(`Assessing risk for user: ${body.userId}`);
    
    return this.mlService.assessCreditRisk({
      userId: body.userId,
      loanAmount: body.loanAmount,
      loanTermMonths: body.loanTermMonths,
      collateralAmount: body.collateralAmount,
      collateralType: body.collateralType,
      userProfile: body.userProfile,
    });
  }
}
