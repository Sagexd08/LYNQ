import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Blockchain')
@Controller('blockchain')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get blockchain connection status' })
  @ApiResponse({ status: 200, description: 'Connection status retrieved' })
  async getStatus() {
    const isConnected = this.blockchainService.isBlockchainConnected();

    if (!isConnected) {
      return {
        connected: false,
        message: 'Blockchain service is not connected',
      };
    }

    const blockNumber = await this.blockchainService.getCurrentBlockNumber();

    return {
      connected: true,
      currentBlock: blockNumber,
    };
  }
}
