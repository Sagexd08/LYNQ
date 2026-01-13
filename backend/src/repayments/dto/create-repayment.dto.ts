import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateRepaymentDto {
    @IsUUID()
    @IsNotEmpty()
    loanId: string;

    @IsInt()
    @Min(1)
    amount: number;
}
