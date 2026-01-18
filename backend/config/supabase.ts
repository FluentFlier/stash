import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Setup Supabase options
const options = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
};

// Create standard client (anon)
export const supabase = config.supabase.url && config.supabase.anonKey
    ? createClient(config.supabase.url, config.supabase.anonKey, options)
    : null;

// Create admin client (service_role)
export const supabaseAdmin = config.supabase.url && config.supabase.serviceKey
    ? createClient(config.supabase.url, config.supabase.serviceKey, options)
    : null;
