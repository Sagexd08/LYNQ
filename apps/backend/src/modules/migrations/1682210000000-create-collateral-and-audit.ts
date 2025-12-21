import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCollateralAndAudit1682210000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'collateral',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', isGenerated: true },
          { name: 'userId', type: 'varchar', length: '128' },
          { name: 'tokenAddress', type: 'varchar', length: '128' },
          { name: 'amount', type: 'numeric', precision: 36, scale: 18 },
          { name: 'status', type: 'varchar', length: '32', default: `'LOCKED'` },
          { name: 'lastValuation', type: 'numeric', precision: 36, scale: 18, isNullable: true },
          { name: 'lastValuationAt', type: 'timestamptz', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'NOW()' },
          { name: 'updatedAt', type: 'timestamptz', default: 'NOW()' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_log',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', isGenerated: true },
          { name: 'action', type: 'varchar', length: '50' },
          { name: 'resource', type: 'varchar', length: '100', isNullable: true },
          { name: 'userId', type: 'varchar', length: '255', isNullable: true },
          { name: 'riskScore', type: 'smallint', isNullable: true },
          { name: 'riskLevel', type: 'varchar', length: '20', isNullable: true },
          { name: 'recommendation', type: 'varchar', length: '20', isNullable: true },
          { name: 'confidence', type: 'smallint', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'createdAt', type: 'timestamptz', default: 'NOW()' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_log');
    await queryRunner.dropTable('collateral');
  }
}
