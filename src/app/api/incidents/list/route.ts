/**
 * GET /api/incidents/list
 *
 * Returns the most recent incidents. When Supabase is configured AND the
 * `incidents` table exists, rows are fetched from there. Otherwise we
 * return an empty list with `demoMode: true` so the client knows to fall
 * back to its own in-memory Zustand store.
 */
import { NextResponse } from "next/server";
import { authEnabled, createClient } from "@/lib/supabase/server";
import { guardApi } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const url = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10) || 25),
  );

  if (!authEnabled) {
    return NextResponse.json({
      ok: true,
      demoMode: true,
      source: "demo",
      message:
        "Supabase not configured — incident list is held in the client-side store. This endpoint will return rows once you enable Supabase and run schema.sql.",
      incidents: [],
    });
  }

  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("client unavailable");
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      return NextResponse.json({
        ok: false,
        demoMode: false,
        source: "supabase",
        message: error.message,
        incidents: [],
      });
    }
    return NextResponse.json({
      ok: true,
      demoMode: false,
      source: "supabase",
      incidents: data ?? [],
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      demoMode: false,
      source: "supabase",
      message: err instanceof Error ? err.message : "unknown error",
      incidents: [],
    });
  }
}
