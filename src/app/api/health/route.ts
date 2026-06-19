/**
 * GET /api/health
 *
 * Cheap liveness probe used by deployment platforms (Vercel, Render, etc.)
 * and by the in-app /system-check page. Public — never gated.
 */
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pulseguard-cyber-ai",
    version: "1.0.0",
    ts: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    demoMode: !authEnabled,
    auth: authEnabled ? "supabase" : "demo",
    openai: Boolean(process.env.OPENAI_API_KEY) ? "configured" : "fallback",
  });
}
