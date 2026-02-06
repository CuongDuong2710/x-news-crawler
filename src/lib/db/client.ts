import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
// Set these in your .env.local file for production use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client (will be null if credentials not provided)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Check if we're using Supabase or local state
export const isUsingSupabase = !!supabase;

// Helper to log database mode on startup
export function logDatabaseMode() {
    if (isUsingSupabase) {
        console.log('🗄️ Connected to Supabase database');
    } else {
        console.log('💻 Using local state (no Supabase credentials provided)');
    }
}
