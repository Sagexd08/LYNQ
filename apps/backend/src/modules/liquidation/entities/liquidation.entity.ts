import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum LiquidatorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum LiquidationAuctionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
}

@Entity('liquidators')
@Index(['walletAddress'], { unique: true })
@Index(['status'])
export class Liquidator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  walletAddress!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'enum', enum: LiquidatorStatus, default: LiquidatorStatus.ACTIVE })
  status!: LiquidatorStatus;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  successRate!: string;

  @Column({ type: 'integer', default: 0 })
  totalLiquidations!: number;

  @Column({ type: 'integer', default: 0 })
  successfulLiquidations!: number;

  @Column({ type: 'integer', default: 0 })
  failedLiquidations!: number;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: 0 })
  totalVolumeProcessed!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  minimumBidIncrement!: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: 0 })
  bondRequired!: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, default: 0 })
  bondPosted!: string;

  @Column({ nullable: true })
  apiKey?: string;

  @Column({ type: 'integer', default: 0 })
  failureCount!: number;

  @Column({ type: 'integer', default: 0 })
  suspensionScore!: number;

  @Column({ nullable: true })
  suspendedUntil?: Date;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: {
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
    operatingCountries?: string[];
    specializations?: string[];
    website?: string;
    contact?: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('liquidation_auctions')
@Index(['loanId'], { unique: true })
@Index(['status'])
@Index(['auctionStartTime'])
export class LiquidationAuction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  loanId!: string;

  @Column()
  borrower!: string;

  @Column()
  collateralToken!: string;

  @Column({ type: 'decimal', precision: 28, scale: 8 })
  collateralAmount!: string;

  @Column({ type: 'decimal', precision: 28, scale: 2 })
  startingPrice!: string;

  @Column({ type: 'decimal', precision: 28, scale: 2 })
  currentPrice!: string;

  @Column({ type: 'decimal', precision: 28, scale: 2 })
  minimumPrice!: string;

  @Column({ type: 'enum', enum: LiquidationAuctionStatus, default: LiquidationAuctionStatus.PENDING })
  status!: LiquidationAuctionStatus;

  @Column()
  auctionStartTime!: Date;

  @Column()
  auctionEndTime!: Date;

  @Column({ type: 'integer', default: 0 })
  priceDecayPercentPerHour!: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  platformFeePercentage!: string;

  @Column({ nullable: true })
  winningBidId?: string;

  @Column({ nullable: true })
  winnerAddress?: string;

  @Column({ nullable: true })
  executedAt?: Date;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: {
    chain?: string;
    loanAmount?: string;
    interestRate?: string;
    urgencyScore?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('liquidator_bids')
@Index(['auctionId', 'liquidatorId'], { unique: true })
@Index(['status'])
@Index('idx_bid_amount_desc', ['bidAmount'])
export class LiquidatorBid {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  auctionId!: string;

  @Column()
  liquidatorId!: string;

  @Column()
  liquidatorAddress!: string;

  @Column({ type: 'decimal', precision: 28, scale: 2 })
  bidAmount!: string;

  @Column({ type: 'decimal', precision: 28, scale: 8, nullable: true })
  tokenAmount?: string;

  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.ACTIVE })
  status!: BidStatus;

  @Column({ type: 'integer', default: 1 })
  bidRound!: number;

  @Column({ type: 'simple-json', nullable: true })
  executionPlan?: {
    swapPath?: string[];
    slippageTolerance?: number;
    estimatedProfit?: string;
    gasEstimate?: string;
  };

  @Column({ type: 'boolean', default: false })
  isAutomatic!: boolean;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  executedAt?: Date;

  @CreateDateColumn()
  bidTime!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('liquidation_events')
@Index(['loanId'])
@Index(['auctionId'])
@Index(['liquidatorId'])
@Index(['eventType'])
@Index(['createdAt'])
export class LiquidationEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  loanId!: string;

  @Column({ nullable: true })
  auctionId?: string;

  @Column({ nullable: true })
  liquidatorId?: string;

  @Column()
  eventType!: string;

  @Column({ type: 'simple-json' })
  eventData!: Record<string, any>;

  @Column({ type: 'decimal', precision: 28, scale: 2, nullable: true })
  amountInvolved?: string;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  blockNumber?: number;

  @Column({ nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
