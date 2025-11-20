import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('trust_scores')
export class TrustScore {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ unique: true })
  userId!: string;

  @Column({ type: 'int', default: 500 })
  score!: number;

  @Column({ type: 'int', default: 0 })
  repaymentRecord!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}