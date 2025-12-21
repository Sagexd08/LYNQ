import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum CollateralStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  LIQUIDATED = 'LIQUIDATED',
}

@Entity({ name: 'collateral' })
export class Collateral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  userId: string;

  @Column({ type: 'varchar', length: 128 })
  tokenAddress: string;

  @Column({ type: 'numeric', precision: 36, scale: 18 })
  amount: string;

  @Column({ type: 'varchar', length: 32, default: CollateralStatus.LOCKED })
  status: CollateralStatus;

  @Column({ type: 'numeric', precision: 36, scale: 18, nullable: true })
  lastValuation?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastValuationAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
