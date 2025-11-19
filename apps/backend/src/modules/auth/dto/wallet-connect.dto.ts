import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ChainType {
  EVM = 'evm',
  APTOS = 'aptos',
  FLOW = 'flow',
}

export class WalletConnectDto {
  @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ example: '0x...' })
  @IsString()
  signature: string;

  @ApiProperty({ example: 'Sign this message to authenticate with LYNQ' })
  @IsString()
  message: string;

  @ApiProperty({ enum: ChainType, example: ChainType.EVM })
  @IsEnum(ChainType)
  chain: ChainType;
}
