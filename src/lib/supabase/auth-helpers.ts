/**
 * Server-side auth helpers — call these from Server Components, Server
 * Actions, or Route Handlers.
 */
import { createClient } from "./server";
import type { Profile, Role } from "@/types/auth";

/** Returns the current authenticated user, or null. */
export async function getUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Returns the current authenticated user's profile (with role), or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

/**
 * Throws-ish helper for API routes: returns null + writes 401 caller-side
 * is expected. Returns `{ user, profile }` on success.
 */
export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) return null;
  return profile;
}

/** Returns the profile if its role is allowed, else null. */
export async function requireRole(allowed: Role | Role[]) {
  const profile = await requireAuth();
  if (!profile) return null;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(profile.role)) return null;
  return profile;
}
