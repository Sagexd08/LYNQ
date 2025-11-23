import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('vouches')
export class Vouch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string; // Storing as string to handle large numbers if needed, or map to DB BigInt

  @Column()
  stakerAddress: string;

  @Column()
  borrowerAddress: string;

  @Column('decimal', { precision: 36, scale: 18 })
  amount: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'WITHDRAWN' | 'SLASHED';

  @Column()
  transactionHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
