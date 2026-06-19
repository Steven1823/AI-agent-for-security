/**
 * POST /api/auth/login
 *
 * - When Supabase is configured: validates credentials and sets the session
 *   cookie via @supabase/ssr.
 * - When Supabase is NOT configured (demo mode): accepts any credentials and
 *   returns a synthetic profile whose role is inferred from the email
 *   (admin@… → admin, engineer@… → engineer, anything else → viewer). The
 *   client then persists this to localStorage so the UI behaves "as if"
 *   signed in. No real auth happens, but the full flow is exercisable.
 */
import { NextResponse } from "next/server";
import { createClient, authEnabled } from "@/lib/supabase/server";
import type { Role } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  email?: string;
  password?: string;
}

function roleFromEmail(email: string): Role {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local === "admin") return "admin";
  if (local === "engineer") return "engineer";
  if (local === "viewer") return "viewer";
  return "admin";
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "User";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  // Demo mode: simulated success so the flow is fully traversable.
  if (!authEnabled) {
    const role = roleFromEmail(email);
    return NextResponse.json({
      ok: true,
      demoMode: true,
      profile: {
        id: `demo_${role}`,
        email,
        full_name: nameFromEmail(email),
        organization: "PulseGuard Demo",
        role,
        avatar_url: null,
        created_at: new Date().toISOString(),
      },
    });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Authentication backend unavailable." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid email or password." },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization, role, avatar_url, created_at")
    .eq("id", data.user.id)
    .single();

  return NextResponse.json({ ok: true, profile: profile ?? null });
}
