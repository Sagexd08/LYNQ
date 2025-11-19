import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' })
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid EVM wallet address' })
  walletAddress?: string;
}
