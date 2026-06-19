/**
 * Tiny helper used by API route handlers to enforce authentication when
 * Supabase is configured. Returns `null` if the request is authorized, or
 * a ready-to-return 401 `NextResponse` otherwise.
 *
 * When Supabase is NOT configured (demo mode), the gate is a no-op so the
 * app keeps working with the in-memory fallbacks.
 */
import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth-helpers";
import type { Profile, Role } from "@/types/auth";

export async function guardApi(opts?: {
  role?: Role | Role[];
}): Promise<{ ok: true; profile: Profile | null } | { ok: false; res: NextResponse }> {
  if (!authEnabled) {
    return { ok: true, profile: null };
  }
  const profile = await getProfile();
  if (!profile) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Unauthorized — sign in required." },
        { status: 401 },
      ),
    };
  }
  if (opts?.role) {
    const list = Array.isArray(opts.role) ? opts.role : [opts.role];
    if (!list.includes(profile.role)) {
      return {
        ok: false,
        res: NextResponse.json(
          { error: `Forbidden — requires role: ${list.join(" | ")}` },
          { status: 403 },
        ),
      };
    }
  }
  return { ok: true, profile };
}
