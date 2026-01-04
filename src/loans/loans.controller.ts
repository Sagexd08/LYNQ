import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';

@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Post()
    create(@Body() createLoanDto: CreateLoanDto) {
        return this.loansService.create(createLoanDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.loansService.findOne(id);
    }
}
