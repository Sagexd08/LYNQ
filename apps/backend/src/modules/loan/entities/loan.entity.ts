import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum LoanStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    REPAID = 'REPAID',
    DEFAULTED = 'DEFAULTED',
    LIQUIDATED = 'LIQUIDATED',
}

@Entity('loans')
export class Loan {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.loans)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    userId!: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    amount!: string;

    @Column({ type: 'decimal', precision: 18, scale: 8, default: '0' })
    outstandingAmount!: string;

    @Column()
    chain!: string;

    @Column()
    collateralTokenAddress!: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    collateralAmount!: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    interestRate!: string;

    @Column({ type: 'int' })
    durationDays!: number;

    @Column({ type: 'simple-enum', enum: LoanStatus, default: LoanStatus.PENDING })
    status!: LoanStatus;

    @Column({ nullable: true })
    contractAddress?: string;

    @Column({ nullable: true })
    transactionHash?: string;

    @Column({ type: 'datetime', nullable: true })
    startDate?: Date;

    @Column({ type: 'datetime', nullable: true })
    dueDate?: Date;

    @Column({ type: 'datetime', nullable: true })
    repaidDate?: Date;

    @Column({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
