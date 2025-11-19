import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Loan } from '../../loan/entities/loan.entity';

export enum CollateralStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  LIQUIDATED = 'LIQUIDATED',
}

@Entity('collaterals')
export class Collateral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Loan, { nullable: true })
  @JoinColumn({ name: 'loanId' })
  loan?: Loan;

  @Column({ nullable: true })
  loanId?: string;

  @Column()
  chain!: string;

  @Column()
  tokenAddress!: string;

  @Column()
  tokenSymbol!: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  valueUSD!: string;

  @Column({ type: 'enum', enum: CollateralStatus, default: CollateralStatus.UNLOCKED })
  status!: CollateralStatus;

  @Column({ nullable: true })
  contractAddress?: string;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  unlockedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
