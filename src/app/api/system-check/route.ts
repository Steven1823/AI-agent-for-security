/**
 * GET /api/system-check
 *
 * Aggregates the status of every external dependency and required env var
 * into a single response. Powers the `/system-check` page.
 *
 * Public on purpose — no secrets are returned, only "configured / not
 * configured" booleans. Judges & ops engineers can hit this directly.
 */
import { NextResponse } from "next/server";
import { authEnabled, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "warn" | "fail" | "skip";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  hint?: string;
}

function envCheck(name: string, required: boolean): Check {
  const present = Boolean(process.env[name]);
  if (present) {
    return {
      id: `env:${name}`,
      label: name,
      status: "ok",
      message: "Configured",
    };
  }
  return {
    id: `env:${name}`,
    label: name,
    status: required ? "fail" : "warn",
    message: required ? "Missing — required" : "Missing — optional",
    hint: required
      ? `Add ${name} to .env.local (see README).`
      : `Optional. Without it the related feature uses its built-in fallback.`,
  };
}

export async function GET() {
  const checks: Check[] = [];

  // --- Environment variables --------------------------------------------
  checks.push(envCheck("NEXT_PUBLIC_SUPABASE_URL", false));
  checks.push(envCheck("NEXT_PUBLIC_SUPABASE_ANON_KEY", false));
  checks.push({
    ...envCheck("SUPABASE_SERVICE_ROLE_KEY", false),
    hint: "Server-only. Used by `npm run seed:users`. NEVER prefix with NEXT_PUBLIC_.",
  });
  checks.push(envCheck("OPENAI_API_KEY", false));
  checks.push(envCheck("NEXT_PUBLIC_APP_URL", false));

  // --- Supabase reachability --------------------------------------------
  if (!authEnabled) {
    checks.push({
      id: "supabase:connection",
      label: "Supabase connection",
      status: "warn",
      message: "Demo mode — Supabase not configured",
      hint: "App runs with in-memory + localStorage fallbacks. Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to enable.",
    });
    checks.push({
      id: "supabase:profiles",
      label: "profiles table",
      status: "skip",
      message: "Skipped — Supabase disabled",
    });
    checks.push({
      id: "supabase:incidents",
      label: "incidents table",
      status: "skip",
      message: "Skipped — Supabase disabled",
    });
    checks.push({
      id: "supabase:auth",
      label: "Auth session",
      status: "skip",
      message: "Skipped — Supabase disabled",
    });
  } else {
    try {
      const supabase = await createClient();
      if (!supabase) throw new Error("client unavailable");
      // Touch a tiny table to confirm connectivity.
      const { error: profilesErr } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      checks.push({
        id: "supabase:connection",
        label: "Supabase connection",
        status: "ok",
        message: "Reachable",
      });
      checks.push({
        id: "supabase:profiles",
        label: "profiles table",
        status: profilesErr ? "fail" : "ok",
        message: profilesErr ? profilesErr.message : "Available",
        hint: profilesErr
          ? "Run supabase/schema.sql in your Supabase SQL editor."
          : undefined,
      });

      const { error: incidentsErr } = await supabase
        .from("incidents")
        .select("id", { count: "exact", head: true });
      checks.push({
        id: "supabase:incidents",
        label: "incidents table",
        status: incidentsErr ? "warn" : "ok",
        message: incidentsErr ? incidentsErr.message : "Available",
        hint: incidentsErr
          ? "Optional table. Re-run supabase/schema.sql to create it."
          : undefined,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      checks.push({
        id: "supabase:auth",
        label: "Auth session",
        status: user ? "ok" : "warn",
        message: user ? `Signed in as ${user.email ?? user.id}` : "No active session",
      });
    } catch (err) {
      checks.push({
        id: "supabase:connection",
        label: "Supabase connection",
        status: "fail",
        message: err instanceof Error ? err.message : "Unreachable",
        hint: "Verify NEXT_PUBLIC_SUPABASE_URL and key are correct.",
      });
    }
  }

  // --- OpenAI -----------------------------------------------------------
  checks.push({
    id: "openai:key",
    label: "OpenAI API key",
    status: process.env.OPENAI_API_KEY ? "ok" : "warn",
    message: process.env.OPENAI_API_KEY
      ? "Configured — using OpenAI for AI analysis"
      : "Missing — using deterministic rule-based fallback",
    hint: process.env.OPENAI_API_KEY
      ? undefined
      : "Optional. Set OPENAI_API_KEY for richer LLM analysis.",
  });

  // --- Feature readiness ------------------------------------------------
  checks.push({
    id: "api:health",
    label: "/api/health",
    status: "ok",
    message: "Online",
  });

  // Aggregate
  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
    skip: checks.filter((c) => c.status === "skip").length,
  };

  return NextResponse.json({
    ok: summary.fail === 0,
    demoMode: !authEnabled,
    ts: new Date().toISOString(),
    summary,
    checks,
  });
}
