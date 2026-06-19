"use client";

/**
 * Client-side auth context.
 *
 * Bootstraps from /api/auth/profile (which uses the secure server cookie),
 * then subscribes to Supabase auth events on the browser so the UI updates
 * instantly on sign-in / sign-out without a full page reload.
 *
 * In "demo mode" (no NEXT_PUBLIC_SUPABASE_URL), the API returns a synthetic
 * admin profile so role-gated UI still renders.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PERMISSIONS, type Profile, type Role } from "@/types/auth";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  profile: Profile | null;
  demoMode: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
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
      setDemoMode(Boolean(json.demoMode));
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
  }, [router]);

  const value = React.useMemo<AuthContextValue>(() => {
    const role: Role = profile?.role ?? "viewer";
    return {
      status,
      profile,
      demoMode,
      refresh,
      signOut,
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
  }, [status, profile, demoMode, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
