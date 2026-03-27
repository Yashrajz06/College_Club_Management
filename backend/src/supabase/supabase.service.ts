import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      this.logger.warn('SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Supabase client will not be available.');
      return;
    }

    this.client = createClient(url, key);
    this.logger.log('Supabase client initialized');
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client is not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.');
    }
    return this.client;
  }

  // Convenience: generic query helper scoped by collegeId
  async queryScoped(table: string, collegeId: string, selectFields = '*') {
    return this.getClient()
      .from(table)
      .select(selectFields)
      .eq('collegeId', collegeId);
  }
}
