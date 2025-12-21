import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Loan } from './loan.entity';

export enum RepaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    LATE = 'LATE',
}

@Entity('repayments')
export class Repayment {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Loan)
    @JoinColumn({ name: 'loanId' })
    loan!: Loan;

    @Column()
    loanId!: string;

    @Column({ type: 'decimal', precision: 18, scale: 8 })
    amount!: string;

    @Column({ type: 'datetime' }) // 'timestamp' in postgres, 'datetime' in sqlite usually preferred but 'timestamp' works
    dueDate!: Date;

    @Column({ type: 'simple-enum', enum: RepaymentStatus, default: RepaymentStatus.PENDING })
    status!: RepaymentStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
