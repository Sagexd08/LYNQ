import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateLoanDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsInt()
    @Min(1)
    amount: number;

    @IsInt()
    @Min(1)
    durationDays: number;
}
