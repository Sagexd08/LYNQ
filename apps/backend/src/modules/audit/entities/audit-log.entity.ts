import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditOutcome {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARN = 'WARN',
}

@Entity({ name: 'audit_log' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resource?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId?: string | null;

  @Column({ type: 'smallint', nullable: true })
  riskScore?: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  riskLevel?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recommendation?: string | null;

  @Column({ type: 'smallint', nullable: true })
  confidence?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createdAt: Date;
}
