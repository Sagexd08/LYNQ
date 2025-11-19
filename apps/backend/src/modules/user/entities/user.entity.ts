import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';

export enum ReputationTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ type: 'json', nullable: true })
  walletAddresses?: Record<string, string>;

  @Column({
    type: 'enum',
    enum: ReputationTier,
    default: ReputationTier.BRONZE,
  })
  reputationTier!: ReputationTier;

  @Column({ type: 'int', default: 0 })
  reputationPoints!: number;

  @Column({ default: false })
  kycVerified!: boolean;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => Loan, (loan) => loan.user)
  loans?: Loan[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
