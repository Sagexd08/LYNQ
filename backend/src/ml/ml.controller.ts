import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MlService } from './ml.service';
import { MlAssessmentRequestDto, MlAssessmentResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ML')
@Controller('ml')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('assess')
  @ApiOperation({ summary: 'Get credit risk assessment' })
  @ApiResponse({
    status: 200,
    description: 'Assessment completed',
    type: MlAssessmentResponseDto,
  })
  async assessRisk(
    @Body() dto: MlAssessmentRequestDto,
  ): Promise<MlAssessmentResponseDto> {
    return this.mlService.assessCreditRisk(dto);
  }
}
