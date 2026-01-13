import { Controller, Post, Body } from '@nestjs/common';
import { RepaymentsService } from './repayments.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';

@Controller('repayments')
export class RepaymentsController {
    constructor(private readonly repaymentsService: RepaymentsService) { }

    @Post()
    create(@Body() createRepaymentDto: CreateRepaymentDto) {
        return this.repaymentsService.create(createRepaymentDto);
    }
}
