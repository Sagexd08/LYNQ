import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    async getHealth() {
        let dbStatus = 'ok';
        const started = Date.now();
        let dbLatencyMs = 0;
        try {
            const { error } = await this.supabase.from('users').select('id').limit(1).single();
            // It's okay if no users exist, as long as it's not a connection error. 
            // single() returns error 'BGJSON' if 0 rows, which is distinct from network error.
            if (error && error.code !== 'PGRST116') { // PGRST116 is JSON object not found (no rows)
                throw error;
            }
            dbLatencyMs = Date.now() - started;
        } catch (error) {
            console.error('Health Check DB Error:', error);
            try {
                require('fs').appendFileSync('debug_error.log', `[${new Date().toISOString()}] Health Error: ${JSON.stringify(error, null, 2)}\n`);
            } catch (ignored) { }
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
