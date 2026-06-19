/**
 * POST /api/auth/login
 *
 * Validates credentials with Supabase. Sets the session cookie via the SSR
 * helper so subsequent requests (and the middleware route gate) see the
 * authenticated user.
 */
import { NextResponse } from "next/server";
import { createClient, authEnabled } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  if (!authEnabled) {
    return NextResponse.json(
      { error: "Authentication is not configured on this deployment." },
      { status: 503 },
    );
  }

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

  // Load profile so the client can immediately route on role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization, role, avatar_url, created_at")
    .eq("id", data.user.id)
    .single();

  return NextResponse.json({ ok: true, profile: profile ?? null });
}
