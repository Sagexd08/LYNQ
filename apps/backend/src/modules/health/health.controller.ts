import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    async getHealth() {
        let dbStatus = 'ok';
        const started = Date.now();
        let dbLatencyMs = 0;
        try {
            await this.dataSource.query('SELECT 1');
            dbLatencyMs = Date.now() - started;
        } catch (error) {
            dbStatus = 'error';
            dbLatencyMs = Date.now() - started;
        }

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            databaseLatencyMs: dbLatencyMs,
            uptimeSeconds: Math.round(process.uptime()),
            nodeEnv: process.env.NODE_ENV || 'development',
            version: '2.0.0-rebuilt',
        };
    }
}
