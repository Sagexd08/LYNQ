import { IsEmail, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    walletAddresses?: Record<string, string>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    kycVerified?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

