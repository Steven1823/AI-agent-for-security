/**
 * POST /api/demo/reset
 *
 * Tells the client to fully reset its demo state (clears Zustand store,
 * wipes the local demo session). The server is essentially stateless in
 * demo mode, so this endpoint just acknowledges the intent — the actual
 * reset is performed client-side using the returned payload.
 */
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({
    ok: true,
    demoMode: !authEnabled,
    message: authEnabled
      ? "Server-side state is owned by Supabase. This call only clears the in-memory client store."
      : "Demo state reset acknowledged. Client will clear localStorage + Zustand.",
    apply: {
      clearStore: true,
      clearLocalDemoSession: !authEnabled,
    },
  });
}
