/**
 * Browser-side Supabase client for use inside `"use client"` components.
 *
 * Reads only the public `NEXT_PUBLIC_*` env vars — never the service-role key.
 * If the env vars are missing the function returns `null` so the rest of the
 * app can detect "demo mode" and degrade gracefully (the QA pass relies on
 * the app continuing to run with no Supabase configured).
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(url && anon);

export function createClient(): SupabaseClient | null {
  if (!authEnabled) return null;
  return createBrowserClient(url as string, anon as string);
}
