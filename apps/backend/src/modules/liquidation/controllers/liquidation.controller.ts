import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RateLimit, Strict, Normal } from '../../../common/guards/rate-limit.guard';
import { LiquidatorProtocolService } from '../services/liquidator-protocol.service';
import {
  Liquidator,
  LiquidationAuction,
  LiquidatorBid,
  LiquidationEvent,
} from '../entities/liquidation.entity';

@ApiTags('Liquidation')
@Controller('liquidation')
export class LiquidationController {
  constructor(
    private readonly liquidatorProtocolService: LiquidatorProtocolService,
  ) {}

  @Post('liquidators/register')
  @Strict()
  @ApiOperation({ summary: 'Register as a liquidator' })
  @ApiResponse({ status: 200, type: Liquidator })
  async registerLiquidator(
    @Body()
    body: {
      walletAddress: string;
      minimumBidIncrement: string;
      bondAmount: string;
      name?: string;
      metadata?: any;
    },
  ): Promise<Liquidator> {
    return this.liquidatorProtocolService.registerLiquidator(
      body.walletAddress,
      body.minimumBidIncrement,
      body.bondAmount,
      body.metadata,
    );
  }

  @Get('liquidators/:id/stats')
  @ApiOperation({ summary: 'Get liquidator performance stats' })
  @ApiResponse({ status: 200, type: Liquidator })
  async getLiquidatorStats(@Param('id') liquidatorId: string): Promise<Liquidator> {
    return this.liquidatorProtocolService.getLiquidatorStats(liquidatorId);
  }

  @Post('auctions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Strict()
  @ApiOperation({ summary: 'Create liquidation auction for a loan' })
  @ApiResponse({ status: 200, type: LiquidationAuction })
  async createAuction(
    @Body()
    body: {
      loanId: string;
      borrower: string;
      collateralToken: string;
      collateralAmount: string;
      collateralValueUSD: string;
      urgencyScore?: number;
    },
  ): Promise<LiquidationAuction> {
    return this.liquidatorProtocolService.createAuction(
      body.loanId,
      body.borrower,
      body.collateralToken,
      body.collateralAmount,
      body.collateralValueUSD,
      body.urgencyScore || 50,
    );
  }

  @Put('auctions/:id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Strict()
  @ApiOperation({ summary: 'Activate auction (start bidding period)' })
  @ApiResponse({ status: 200, type: LiquidationAuction })
  async activateAuction(@Param('id') auctionId: string): Promise<LiquidationAuction> {
    return this.liquidatorProtocolService.activateAuction(auctionId);
  }

  @Get('auctions/active')
  @Normal()
  @ApiOperation({ summary: 'Get all active auctions' })
  @ApiResponse({ status: 200, isArray: true, type: LiquidationAuction })
  async getActiveAuctions(): Promise<LiquidationAuction[]> {
    return this.liquidatorProtocolService.getActiveAuctions();
  }

  @Get('auctions/:id')
  @Normal()
  @ApiOperation({ summary: 'Get auction details' })
  @ApiResponse({ status: 200, type: LiquidationAuction })
  async getAuction(@Param('id') auctionId: string): Promise<LiquidationAuction> {

    const auctions = await this.liquidatorProtocolService.getActiveAuctions();
    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }
    return auction;
  }

  @Post('bids')
  @Strict()
  @ApiOperation({ summary: 'Place bid on auction' })
  @ApiResponse({ status: 200, type: LiquidatorBid })
  async placeBid(
    @Body()
    body: {
      auctionId: string;
      liquidatorId: string;
      liquidatorAddress: string;
      bidAmount: string;
      executionPlan?: any;
    },
  ): Promise<LiquidatorBid> {
    return this.liquidatorProtocolService.placeBid(
      body.auctionId,
      body.liquidatorId,
      body.liquidatorAddress,
      body.bidAmount,
      body.executionPlan,
    );
  }

  @Get('auctions/:id/bids')
  @Normal()
  @ApiOperation({ summary: 'Get all bids for an auction' })
  @ApiResponse({ status: 200, isArray: true, type: LiquidatorBid })
  async getAuctionBids(@Param('id') auctionId: string): Promise<LiquidatorBid[]> {
    return this.liquidatorProtocolService.getAuctionBids(auctionId);
  }

  @Put('auctions/:id/execute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Strict()
  @ApiOperation({ summary: 'Execute auction (sell collateral)' })
  @ApiResponse({ status: 200, type: LiquidationAuction })
  async executeAuction(
    @Param('id') auctionId: string,
    @Body() body: { transactionHash?: string },
  ): Promise<LiquidationAuction> {
    return this.liquidatorProtocolService.executeAuction(
      auctionId,
      body.transactionHash,
    );
  }

  @Put('liquidations/failed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark liquidation as failed' })
  async markLiquidationFailed(
    @Body()
    body: {
      auctionId: string;
      liquidatorId: string;
      failureReason: string;
    },
  ): Promise<void> {
    return this.liquidatorProtocolService.markLiquidationFailed(
      body.auctionId,
      body.liquidatorId,
      body.failureReason,
    );
  }

  @Get('loans/:loanId/history')
  @Normal()
  @ApiOperation({ summary: 'Get liquidation history for a loan' })
  @ApiResponse({ status: 200, isArray: true, type: LiquidationEvent })
  async getLiquidationHistory(
    @Param('loanId') loanId: string,
  ): Promise<LiquidationEvent[]> {
    return this.liquidatorProtocolService.getLiquidationHistory(loanId);
  }

  @Get('auctions/:id/current-price')
  @Normal()
  @ApiOperation({ summary: 'Get current price of an auction (Dutch auction)' })
  @ApiResponse({
    status: 200,
    schema: { properties: { currentPrice: { type: 'string' } } },
  })
  async getCurrentPrice(
    @Param('id') auctionId: string,
  ): Promise<{ currentPrice: string }> {

    const auctions = await this.liquidatorProtocolService.getActiveAuctions();
    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    const currentPrice = this.liquidatorProtocolService['calculateCurrentPrice'](auction);
    return { currentPrice };
  }
}
