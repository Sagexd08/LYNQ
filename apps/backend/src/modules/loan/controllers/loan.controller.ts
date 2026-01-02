import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoanService } from '../services/loan.service';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { CheckOwnership } from '../../../common/decorators/resource-owner.decorator';

@ApiTags('Loans')
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(5, 60)
  @ApiOperation({ summary: 'Create a new loan request' })
  async create(@Request() req: any, @Body() createLoanDto: CreateLoanDto): Promise<any> {
    return this.loanService.create(req.user.id, createLoanDto);
  }

  @Get('check-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle(10, 60)
  @ApiOperation({ summary: 'Check loan eligibility' })
  @ApiQuery({ name: 'amount', required: true, type: Number })
  async checkEligibility(@Request() req: any, @Query('amount') amount: number): Promise<any> {
    return this.loanService.checkEligibility(req.user.id, amount);
  }

  @Get('my-loans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user loans (paginated)' })
  @ApiQuery({ name: 'status', required: false })
  async getMyLoans(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string
  ): Promise<any> {
    return this.loanService.findByUser(req.user.id, status, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'loan', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get loan by ID' })
  async getLoanById(@Request() req: any, @Param('id') id: string): Promise<any> {
    
    return this.loanService.findById(id);
  }

  @Put(':id/repay')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'loan', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repay a loan' })
  async repay(@Request() req: any, @Param('id') id: string, @Body() repayLoanDto: RepayLoanDto): Promise<any> {
    
    return this.loanService.repay(id, repayLoanDto);
  }

  @Put(':id/liquidate')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'loan', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liquidate a defaulted loan' })
  async liquidate(@Request() req: any, @Param('id') id: string): Promise<any> {
    
    return this.loanService.liquidate(id);
  }

  @Post(':id/refinance')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @CheckOwnership({ resourceType: 'loan', resourceIdParam: 'id' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request refinance offer' })
  async refinance(@Param('id') id: string, @Request() req: any): Promise<any> {
    
    return this.loanService.createRefinanceOffer(id, req.user.id);
  }
}
