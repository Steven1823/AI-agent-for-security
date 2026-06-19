"use client";

/**
 * Client-side auth context.
 *
 * Bootstraps from /api/auth/profile (which uses the secure server cookie),
 * then subscribes to Supabase auth events on the browser so the UI updates
 * instantly on sign-in / sign-out without a full page reload.
 *
 * Demo mode (no NEXT_PUBLIC_SUPABASE_URL):
 *   - The server endpoint returns `demoMode: true` and a synthetic admin
 *     profile.
 *   - The client layers a localStorage session on top so the user can
 *     "sign in" as different demo roles (admin / engineer / viewer),
 *     navigate the whole product, and sign out — all without a real
 *     backend. The full flow upgrades automatically when Supabase env vars
 *     are added later; no UI changes required.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PERMISSIONS, type Profile, type Role } from "@/types/auth";

type Status = "loading" | "authenticated" | "unauthenticated";

const DEMO_SESSION_KEY = "pulseguard.demo.session";

interface AuthContextValue {
  status: Status;
  profile: Profile | null;
  demoMode: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Persist a profile as the "active" demo session. Login / signup forms
   * call this after a successful response when running in demo mode.
   * No-op when real auth is configured.
   */
  setDemoSession: (profile: Profile) => void;
  can: {
    runChaos: boolean;
    approveActions: boolean;
    manageUsers: boolean;
    editSettings: boolean;
    runAnalyzer: boolean;
  };
  hasRole: (role: Role | Role[]) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function readDemoSession(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDemoSession(p: Profile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(p));
  } catch {
    /* ignore (private mode etc.) */
  }
}

function clearDemoSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>("loading");
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [demoMode, setDemoMode] = React.useState(false);
  const router = useRouter();

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/profile", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setProfile(null);
        setStatus("unauthenticated");
        setDemoMode(false);
        return;
      }
      const json = (await res.json()) as {
        profile: Profile | null;
        demoMode?: boolean;
      };

      const isDemo = Boolean(json.demoMode);
      setDemoMode(isDemo);

      if (isDemo) {
        // Prefer the user-chosen demo session; if none, treat as signed
        // out so the landing/login flow has somewhere to land first.
        const stored = readDemoSession();
        if (stored) {
          setProfile(stored);
          setStatus("authenticated");
        } else {
          setProfile(null);
          setStatus("unauthenticated");
        }
        return;
      }

      if (json.profile) {
        setProfile(json.profile);
        setStatus("authenticated");
      } else {
        setProfile(null);
        setStatus("unauthenticated");
      }
    } catch {
      setStatus("unauthenticated");
      setProfile(null);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    const supabase = createClient();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setStatus("unauthenticated");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void refresh();
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  const signOut = React.useCallback(async () => {
    // Demo mode: clear local session, route to /login. No server call needed
    // (there's no real session to invalidate) but we still hit the endpoint
    // so behavior is identical when Supabase is later enabled.
    if (demoMode) {
      clearDemoSession();
      setProfile(null);
      setStatus("unauthenticated");
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
      router.push("/login");
      router.refresh();
      return;
    }

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setStatus("unauthenticated");
    router.push("/login");
    router.refresh();
  }, [router, demoMode]);

  const setDemoSession = React.useCallback((p: Profile) => {
    writeDemoSession(p);
    setProfile(p);
    setStatus("authenticated");
  }, []);

  const value = React.useMemo<AuthContextValue>(() => {
    const role: Role = profile?.role ?? "viewer";
    return {
      status,
      profile,
      demoMode,
      refresh,
      signOut,
      setDemoSession,
      can: {
        runChaos: PERMISSIONS.canRunChaos(role),
        approveActions: PERMISSIONS.canApproveActions(role),
        manageUsers: PERMISSIONS.canManageUsers(role),
        editSettings: PERMISSIONS.canEditSettings(role),
        runAnalyzer: PERMISSIONS.canRunAnalyzer(role),
      },
      hasRole: (r: Role | Role[]) => {
        if (!profile) return false;
        const list = Array.isArray(r) ? r : [r];
        return list.includes(profile.role);
      },
    };
  }, [status, profile, demoMode, refresh, signOut, setDemoSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
