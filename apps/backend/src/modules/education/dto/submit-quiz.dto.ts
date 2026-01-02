import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitQuizDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsObject()
    answers!: Record<string, any>;
}
