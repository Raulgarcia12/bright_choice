/**
 * Supabase Admin Client
 * Uses the SERVICE_ROLE key for full database access (server-side only).
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
