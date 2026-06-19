/**
 * GET /api/auth/profile — returns the current user's profile (with role) or
 * 401 if not signed in. When Supabase is not configured this returns a
 * synthetic demo profile so the client can render without errors.
 */
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!authEnabled) {
    return NextResponse.json({
      profile: {
        id: "demo",
        email: "demo@pulseguard.ai",
        full_name: "Demo Operator",
        organization: "PulseGuard Demo",
        role: "admin",
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
      demoMode: true,
    });
  }
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }
  return NextResponse.json({ profile });
}
