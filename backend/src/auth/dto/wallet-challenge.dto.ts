import { IsString, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WalletChallengeDto {
    @ApiProperty({
        description: 'Ethereum wallet address',
        example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92',
    })
    @IsString()
    @IsEthereumAddress()
    walletAddress: string;
}

export class WalletChallengeResponseDto {
    @ApiProperty({
        description: 'Unique nonce for this authentication attempt',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    nonce: string;

    @ApiProperty({
        description: 'Message to sign with wallet',
        example: 'Welcome to LYNQ!\n\nSign this message to authenticate your wallet...',
    })
    message: string;
}
