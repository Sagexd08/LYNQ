import { IsString, IsEthereumAddress, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletVerifyDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92',
  })
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Signature from wallet signing the challenge message',
    example: '0x...',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Nonce received from challenge endpoint',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  nonce: string;
}
