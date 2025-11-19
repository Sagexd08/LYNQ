import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LoanService } from '../services/loan.service';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Loans')
@Controller('loans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  @ApiOperation({ summary: 'Create new loan' })
  async createLoan(@Request() req: any, @Body() createLoanDto: CreateLoanDto): Promise<any> {
    return this.loanService.create(req.user.id, createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loans for user' })
  @ApiQuery({ name: 'status', required: false })
  async getUserLoans(@Request() req: any, @Query('status') status?: string): Promise<any> {
    return this.loanService.findByUser(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan by ID' })
  async getLoanById(@Param('id') id: string): Promise<any> {
    return this.loanService.findById(id);
  }

  @Put(':id/repay')
  @ApiOperation({ summary: 'Repay loan' })
  async repayLoan(@Param('id') id: string, @Body() repayLoanDto: RepayLoanDto): Promise<any> {
    return this.loanService.repay(id, repayLoanDto);
  }

  @Put(':id/liquidate')
  @ApiOperation({ summary: 'Liquidate loan' })
  async liquidateLoan(@Param('id') id: string): Promise<any> {
    return this.loanService.liquidate(id);
  }
}
