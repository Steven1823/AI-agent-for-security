/**
 * POST /api/auth/signup
 *
 * Creates a Supabase auth user and lets the `handle_new_user` trigger create
 * the matching profile row from `options.data`. We also defensively upsert
 * the profile here so it works even if the trigger isn't applied yet (e.g.
 * during initial setup).
 */
import { NextResponse } from "next/server";
import { createClient, authEnabled } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/types/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SignupBody {
  email?: string;
  password?: string;
  full_name?: string;
  organization?: string;
  role?: string;
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain a number.";
  return null;
}

export async function POST(request: Request) {
  if (!authEnabled) {
    return NextResponse.json(
      { error: "Authentication is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const full_name = body.full_name?.trim() ?? "";
  const organization = body.organization?.trim() ?? "";
  const role = (ROLES as readonly string[]).includes(body.role ?? "")
    ? (body.role as Role)
    : "viewer";

  if (!email || !password || !full_name || !organization) {
    return NextResponse.json(
      { error: "Full name, organization, email, and password are required." },
      { status: 400 },
    );
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  const pwErr = validatePassword(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Authentication backend unavailable." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, organization, role },
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
      }/dashboard`,
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create account." },
      { status: 400 },
    );
  }

  // Belt-and-suspenders: upsert profile so the row exists even if the
  // database trigger hasn't been applied yet.
  await supabase
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        email,
        full_name,
        organization,
        role,
      },
      { onConflict: "id" },
    );

  // If email confirmation is enabled in Supabase, `session` is null until
  // the user clicks the confirmation link. We surface that to the UI.
  const requiresEmailConfirmation = !data.session;

  return NextResponse.json({
    ok: true,
    requiresEmailConfirmation,
    profile: {
      id: data.user.id,
      email,
      full_name,
      organization,
      role,
    },
  });
}
