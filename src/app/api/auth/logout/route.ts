/**
 * POST /api/auth/logout — clears the Supabase session cookie.
 */
import { NextResponse } from "next/server";
import { createClient, authEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!authEnabled) {
    return NextResponse.json({ ok: true });
  }
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
