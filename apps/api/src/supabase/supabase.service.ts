import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@waste-hub/shared-types';

/**
 * Service-role client — bypasses RLS. This service only ever runs
 * server-side (this whole app is a backend service), but every call site
 * using it is still a trusted-context operation, not a per-user query.
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient<Database>;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const serviceRoleKey = config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this.client = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
