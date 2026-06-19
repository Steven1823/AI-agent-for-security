import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase is optional for the MVP. When env vars are present we persist
 * incidents to the `incidents` table; otherwise the app uses its in-memory
 * Zustand store so the demo always works out of the box.
 */
export const supabaseEnabled = Boolean(url && anon);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anon as string)
  : null;
