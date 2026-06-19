/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Uses Next.js cookie store so the same session is shared
 * with the browser client.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authEnabled = Boolean(url && anon);

export async function createClient(): Promise<SupabaseClient | null> {
  if (!authEnabled) return null;
  // `cookies()` in Next.js 15 is async.
  const cookieStore = await cookies();
  return createServerClient(url as string, anon as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Cookies can't always be mutated (e.g. inside an RSC). The
          // middleware will refresh sessions instead — safe to ignore here.
        }
      },
    },
  });
}
