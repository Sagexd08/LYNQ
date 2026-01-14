import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { ActivateLoanDto } from './dto/activate-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Loans')
@Controller('loans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new loan request' })
    @ApiResponse({ status: 201, description: 'Loan created with risk assessment' })
    @ApiResponse({ status: 400, description: 'Loan rejected or validation error' })
    async create(@CurrentUser() user: { id: string }, @Body() dto: CreateLoanDto) {
        return this.loansService.createLoan(user.id, dto);
    }

    @Post(':id/activate')
    @ApiOperation({ summary: 'Activate a pending loan with collateral verification' })
    @ApiResponse({ status: 200, description: 'Loan activated' })
    async activate(@Param('id') id: string, @Body() dto: ActivateLoanDto) {
        return this.loansService.activateLoan(id, dto);
    }

    @Post(':id/repay')
    @ApiOperation({ summary: 'Make a repayment on a loan' })
    @ApiResponse({ status: 200, description: 'Repayment processed' })
    async repay(@Param('id') id: string, @Body() dto: RepayLoanDto) {
        return this.loansService.repayLoan(id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get current user loans' })
    @ApiResponse({ status: 200, description: 'Loans retrieved' })
    async findMyLoans(@CurrentUser() user: { id: string }) {
        return this.loansService.findByUser(user.id);
    }

    @Get('all')
    @ApiOperation({ summary: 'Get all loans (admin)' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'All loans retrieved' })
    async findAll(
        @Query('status') status?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.loansService.findAll({ status, limit, offset });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get loan by ID' })
    @ApiResponse({ status: 200, description: 'Loan found' })
    @ApiResponse({ status: 404, description: 'Loan not found' })
    async findOne(@Param('id') id: string) {
        return this.loansService.findOne(id);
    }
}
