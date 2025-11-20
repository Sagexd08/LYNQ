import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('platform_stats')
export class PlatformStats {
  @PrimaryColumn()
  id!: string; // e.g., 'indexer'

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated?: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}