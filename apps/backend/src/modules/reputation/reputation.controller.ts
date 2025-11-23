import { Controller, Get, Param } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('vouches/user/:address')
  @ApiOperation({ summary: 'Get all vouches made by a user' })
  async getUserVouches(@Param('address') address: string) {
    return this.reputationService.getVouchesForUser(address);
  }

  @Get('vouches/loan/:loanId')
  @ApiOperation({ summary: 'Get all vouches for a specific loan' })
  async getLoanVouches(@Param('loanId') loanId: string) {
    return this.reputationService.getVouchesForLoan(loanId);
  }
}
