import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { SecretsVaultService } from '../../system/services/secrets-vault.service';
import {
  Liquidator,
  LiquidationAuction,
  LiquidatorBid,
  LiquidationEvent,
  LiquidatorStatus,
  LiquidationAuctionStatus,
  BidStatus,
} from '../entities/liquidation.entity';

@Injectable()
export class LiquidatorProtocolService implements OnModuleInit {
  private readonly logger = new Logger(LiquidatorProtocolService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private liquidatorWallet: ethers.Wallet | null = null;

  private readonly MIN_LIQUIDATOR_BOND = 10000;
  private readonly PLATFORM_FEE_BPS = 250;
  private readonly AUCTION_DURATION_HOURS = 24;
  private readonly DUTCH_AUCTION_DECAY = 2;
  private readonly RESERVE_PRICE_MULTIPLIER = 0.8;

  constructor(
    @InjectRepository(Liquidator)
    private liquidatorRepository: Repository<Liquidator>,
    @InjectRepository(LiquidationAuction)
    private auctionRepository: Repository<LiquidationAuction>,
    @InjectRepository(LiquidatorBid)
    private bidRepository: Repository<LiquidatorBid>,
    @InjectRepository(LiquidationEvent)
    private eventRepository: Repository<LiquidationEvent>,
    private configService: ConfigService,
    private secretsVault: SecretsVaultService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const rpcUrl = this.configService.get<string>('ETHEREUM_RPC_URL');
      if (rpcUrl) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        const privateKey = await this.secretsVault.getSecret(
          'LIQUIDATOR_PRIVATE_KEY',
          'LiquidatorProtocolService',
        );
        this.liquidatorWallet = new ethers.Wallet(privateKey, this.provider);
        this.logger.log('✅ LiquidatorProtocolService initialized');
      }
    } catch (error) {
      this.logger.warn(`LiquidatorProtocolService not fully initialized: ${error.message}`);
    }
  }

  async registerLiquidator(
    walletAddress: string,
    minimumBidIncrement: string,
    bondAmount: string,
    metadata?: any,
  ): Promise<Liquidator> {

    if (!ethers.isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const existing = await this.liquidatorRepository.findOne({
      where: { walletAddress },
    });

    if (existing) {
      throw new ConflictException('Liquidator already registered');
    }

    const bondRequired = this.MIN_LIQUIDATOR_BOND;
    if (parseFloat(bondAmount) < bondRequired) {
      throw new BadRequestException(
        `Minimum bond required: $${bondRequired}`,
      );
    }

    const liquidator = this.liquidatorRepository.create({
      walletAddress,
      minimumBidIncrement,
      bondRequired: bondRequired.toString(),
      bondPosted: bondAmount,
      status: LiquidatorStatus.ACTIVE,
      metadata,
    });

    const saved = await this.liquidatorRepository.save(liquidator);
    this.logger.log(
      `✅ Liquidator registered: ${walletAddress} with bond $${bondAmount}`,
    );

    return saved;
  }

  async createAuction(
    loanId: string,
    borrower: string,
    collateralToken: string,
    collateralAmount: string,
    collateralValueUSD: string,
    urgencyScore: number,
  ): Promise<LiquidationAuction> {

    const existing = await this.auctionRepository.findOne({
      where: { loanId },
    });

    if (existing && existing.status !== LiquidationAuctionStatus.FAILED) {
      throw new ConflictException('Auction already exists for this loan');
    }

    const startingPrice = collateralValueUSD;
    const minimumPrice = (
      parseFloat(startingPrice) * this.RESERVE_PRICE_MULTIPLIER
    ).toString();

    const now = new Date();
    const endTime = new Date(
      now.getTime() + this.AUCTION_DURATION_HOURS * 60 * 60 * 1000,
    );

    const auction = this.auctionRepository.create({
      loanId,
      borrower,
      collateralToken,
      collateralAmount,
      startingPrice,
      currentPrice: startingPrice,
      minimumPrice,
      status: LiquidationAuctionStatus.PENDING,
      auctionStartTime: now,
      auctionEndTime: endTime,
      priceDecayPercentPerHour: this.DUTCH_AUCTION_DECAY,
      platformFeePercentage: (this.PLATFORM_FEE_BPS / 100).toString(),
      metadata: {
        urgencyScore,
      },
    });

    const saved = await this.auctionRepository.save(auction);

    await this.recordEvent(loanId, saved.id, undefined, 'AUCTION_CREATED', {
      collateralToken,
      startingPrice,
      minimumPrice,
    });

    this.logger.log(
      `✅ Auction created for loan ${loanId}: $${startingPrice} → $${minimumPrice}`,
    );

    return saved;
  }

  calculateCurrentPrice(auction: LiquidationAuction): string {
    const now = new Date().getTime();
    const startTime = auction.auctionStartTime.getTime();
    const endTime = auction.auctionEndTime.getTime();

    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;

    if (elapsed < 0) {

      return auction.startingPrice;
    }

    if (elapsed >= totalDuration) {

      return auction.minimumPrice;
    }

    const hoursElapsed = elapsed / (60 * 60 * 1000);

    const startPrice = parseFloat(auction.startingPrice);
    const minPrice = parseFloat(auction.minimumPrice);
    const decayFactor = (
      100 - auction.priceDecayPercentPerHour
    ) / 100;
    const decayedPrice = startPrice * Math.pow(decayFactor, hoursElapsed);

    const finalPrice = Math.max(decayedPrice, minPrice);

    return finalPrice.toFixed(2);
  }

  async placeBid(
    auctionId: string,
    liquidatorId: string,
    liquidatorAddress: string,
    bidAmount: string,
    executionPlan?: any,
  ): Promise<LiquidatorBid> {

    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== LiquidationAuctionStatus.ACTIVE) {
      throw new BadRequestException('Auction is not active');
    }

    const now = new Date();
    if (now > auction.auctionEndTime) {
      throw new BadRequestException('Auction has ended');
    }

    const liquidator = await this.liquidatorRepository.findOne({
      where: { id: liquidatorId },
    });

    if (!liquidator) {
      throw new NotFoundException('Liquidator not found');
    }

    if (liquidator.status !== LiquidatorStatus.ACTIVE) {
      throw new BadRequestException('Liquidator is not active');
    }

    const currentPrice = this.calculateCurrentPrice(auction);

    if (parseFloat(bidAmount) < parseFloat(currentPrice)) {
      throw new BadRequestException(
        `Bid must be at least $${currentPrice}`,
      );
    }

    const existingBid = await this.bidRepository.findOne({
      where: { auctionId, liquidatorId, status: BidStatus.ACTIVE },
    });

    if (existingBid) {

      if (parseFloat(bidAmount) > parseFloat(existingBid.bidAmount)) {
        existingBid.bidAmount = bidAmount;
        existingBid.executionPlan = executionPlan;
        existingBid.bidRound++;
        await this.bidRepository.save(existingBid);

        await this.recordEvent(
          auction.loanId,
          auctionId,
          liquidatorId,
          'BID_UPDATED',
          {
            liquidatorAddress,
            bidAmount,
            previousBid: existingBid.bidAmount,
          },
        );

        return existingBid;
      } else {
        throw new BadRequestException('New bid must be higher than existing bid');
      }
    }

    const bid = this.bidRepository.create({
      auctionId,
      liquidatorId,
      liquidatorAddress,
      bidAmount,
      executionPlan,
    });

    const saved = await this.bidRepository.save(bid);

    auction.currentPrice = bidAmount;
    await this.auctionRepository.save(auction);

    await this.recordEvent(
      auction.loanId,
      auctionId,
      liquidatorId,
      'BID_PLACED',
      {
        liquidatorAddress,
        bidAmount,
      },
    );

    this.logger.log(
      `✅ Bid placed: Liquidator ${liquidatorAddress} bid $${bidAmount} on auction ${auctionId}`,
    );

    return saved;
  }

  async activateAuction(auctionId: string): Promise<LiquidationAuction> {
    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== LiquidationAuctionStatus.PENDING) {
      throw new BadRequestException('Auction is not in PENDING status');
    }

    auction.status = LiquidationAuctionStatus.ACTIVE;
    auction.auctionStartTime = new Date();
    const now = new Date();
    auction.auctionEndTime = new Date(
      now.getTime() + this.AUCTION_DURATION_HOURS * 60 * 60 * 1000,
    );

    const saved = await this.auctionRepository.save(auction);

    await this.recordEvent(
      auction.loanId,
      auctionId,
      undefined,
      'AUCTION_ACTIVATED',
      {
        startTime: auction.auctionStartTime,
        endTime: auction.auctionEndTime,
      },
    );

    this.logger.log(`✅ Auction activated: ${auctionId}`);

    return saved;
  }

  async executeAuction(auctionId: string, transactionHash?: string): Promise<LiquidationAuction> {
    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== LiquidationAuctionStatus.ACTIVE) {
      throw new BadRequestException('Auction is not active');
    }

    const now = new Date();
    if (now < auction.auctionEndTime) {
      throw new BadRequestException('Auction is still ongoing');
    }

    const winningBid = await this.bidRepository.findOne({
      where: { auctionId, status: BidStatus.ACTIVE },
      order: { bidAmount: 'DESC' },
    });

    if (!winningBid) {

      auction.status = LiquidationAuctionStatus.FAILED;
      await this.auctionRepository.save(auction);

      await this.recordEvent(
        auction.loanId,
        auctionId,
        undefined,
        'AUCTION_FAILED',
        { reason: 'No valid bids received' },
      );

      return auction;
    }

    if (parseFloat(winningBid.bidAmount) < parseFloat(auction.minimumPrice)) {

      auction.status = LiquidationAuctionStatus.FAILED;
      await this.auctionRepository.save(auction);

      await this.recordEvent(
        auction.loanId,
        auctionId,
        winningBid.liquidatorId,
        'AUCTION_FAILED',
        {
          reason: 'Winning bid below reserve price',
          bidAmount: winningBid.bidAmount,
          reservePrice: auction.minimumPrice,
        },
      );

      return auction;
    }

    auction.status = LiquidationAuctionStatus.SOLD;
    auction.winningBidId = winningBid.id;
    auction.winnerAddress = winningBid.liquidatorAddress;
    auction.executedAt = now;
    auction.transactionHash = transactionHash;

    winningBid.status = BidStatus.EXECUTED;
    winningBid.executedAt = now;
    winningBid.transactionHash = transactionHash;

    await this.bidRepository.save(winningBid);
    const saved = await this.auctionRepository.save(auction);

    const liquidator = await this.liquidatorRepository.findOne({
      where: { id: winningBid.liquidatorId },
    });

    if (liquidator) {
      liquidator.successfulLiquidations++;
      liquidator.totalLiquidations++;
      liquidator.totalVolumeProcessed = (
        parseFloat(liquidator.totalVolumeProcessed) + parseFloat(winningBid.bidAmount)
      ).toFixed(2);
      liquidator.successRate = (
        (liquidator.successfulLiquidations / liquidator.totalLiquidations) *
        100
      ).toString();
      liquidator.failureCount = 0;

      await this.liquidatorRepository.save(liquidator);
    }

    await this.recordEvent(
      auction.loanId,
      auctionId,
      winningBid.liquidatorId,
      'LIQUIDATION_EXECUTED',
      {
        winnerAddress: winningBid.liquidatorAddress,
        finalPrice: winningBid.bidAmount,
        platformFee: (
          parseFloat(winningBid.bidAmount) *
          (parseFloat(auction.platformFeePercentage) / 100)
        ).toFixed(2),
      },
      winningBid.bidAmount,
      transactionHash,
    );

    this.logger.log(
      `✅ Auction executed: ${auctionId} sold for $${winningBid.bidAmount} to ${winningBid.liquidatorAddress}`,
    );

    return saved;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async settleExpiredAuctions(): Promise<void> {
    const now = new Date();

    const expiredAuctions = await this.auctionRepository.find({
      where: {
        status: LiquidationAuctionStatus.ACTIVE,
      },
    });

    for (const auction of expiredAuctions) {
      if (auction.auctionEndTime <= now) {
        try {
          await this.executeAuction(auction.id);
        } catch (error) {
          this.logger.error(
            `Failed to settle auction ${auction.id}: ${error.message}`,
          );
        }
      }
    }
  }

  async markLiquidationFailed(
    auctionId: string,
    liquidatorId: string,
    failureReason: string,
  ): Promise<void> {
    const auction = await this.auctionRepository.findOne({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    auction.status = LiquidationAuctionStatus.FAILED;
    await this.auctionRepository.save(auction);

    const liquidator = await this.liquidatorRepository.findOne({
      where: { id: liquidatorId },
    });

    if (liquidator) {
      liquidator.failedLiquidations++;
      liquidator.totalLiquidations++;
      liquidator.failureCount++;
      liquidator.suspensionScore = Math.min(
        100,
        liquidator.suspensionScore + 10,
      );

      if (liquidator.failureCount >= 3 || liquidator.suspensionScore >= 70) {
        liquidator.status = LiquidatorStatus.SUSPENDED;
        liquidator.suspendedUntil = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        );
        this.logger.warn(
          `⚠️ Liquidator suspended due to failures: ${liquidator.walletAddress}`,
        );
      }

      liquidator.successRate = (
        (liquidator.successfulLiquidations / liquidator.totalLiquidations) *
        100
      ).toString();

      await this.liquidatorRepository.save(liquidator);
    }

    await this.recordEvent(
      auction.loanId,
      auctionId,
      liquidatorId,
      'LIQUIDATION_FAILED',
      { reason: failureReason },
    );

    this.logger.error(
      `❌ Liquidation failed for auction ${auctionId}: ${failureReason}`,
    );
  }

  async getLiquidatorStats(liquidatorId: string): Promise<Liquidator> {
    const liquidator = await this.liquidatorRepository.findOne({
      where: { id: liquidatorId },
    });

    if (!liquidator) {
      throw new NotFoundException('Liquidator not found');
    }

    return liquidator;
  }

  async getActiveAuctions(): Promise<LiquidationAuction[]> {
    return this.auctionRepository.find({
      where: { status: LiquidationAuctionStatus.ACTIVE },
      order: { auctionEndTime: 'ASC' },
    });
  }

  async getAuctionBids(auctionId: string): Promise<LiquidatorBid[]> {
    return this.bidRepository.find({
      where: { auctionId },
      order: { bidAmount: 'DESC' },
    });
  }

  private async recordEvent(
    loanId: string,
    auctionId: string | undefined,
    liquidatorId: string | undefined,
    eventType: string,
    eventData: Record<string, any>,
    amountInvolved?: string,
    transactionHash?: string,
  ): Promise<void> {
    const event = this.eventRepository.create({
      loanId,
      auctionId,
      liquidatorId,
      eventType,
      eventData,
      amountInvolved,
      transactionHash,
    });

    await this.eventRepository.save(event);
  }

  async getLiquidationHistory(loanId: string): Promise<LiquidationEvent[]> {
    return this.eventRepository.find({
      where: { loanId },
      order: { createdAt: 'DESC' },
    });
  }
}
