import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private readonly logger = new Logger(SupabaseService.name);
    private client: SupabaseClient;

    constructor(private readonly configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || this.configService.get<string>('SUPABASE_KEY');

        if (supabaseUrl && supabaseKey) {
            this.client = createClient(supabaseUrl, supabaseKey);
            this.logger.log('Supabase client initialized');
        } else {
            this.logger.warn('Supabase credentials not found. Client not initialized.');
        }
    }

    getClient(): SupabaseClient {
        return this.client;
    }
}
