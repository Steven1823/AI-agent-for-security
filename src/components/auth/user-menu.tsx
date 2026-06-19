"use client";

/**
 * Avatar dropdown for the topbar.
 *
 * Shows the user's initials, full name, email, role badge, plus a quick
 * link to settings and a sign-out button. Pure client — uses the AuthContext.
 */
import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, ShieldCheck, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL } from "@/types/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function initials(name: string, email: string): string {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) || "??").toUpperCase();
}

export function UserMenu() {
  const { profile, status, signOut, demoMode } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (status === "loading") {
    return (
      <div className="flex h-9 w-9 animate-pulse rounded-full bg-secondary/40" />
    );
  }
  if (!profile) return null;

  const ini = initials(profile.full_name, profile.email);
  const roleBadge =
    profile.role === "admin"
      ? "danger"
      : profile.role === "engineer"
        ? "default"
        : "muted";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 py-1 pl-1 pr-2.5",
          "transition-colors hover:border-border hover:bg-secondary/60",
          open && "border-sky-500/40 bg-secondary/60",
        )}
        aria-label="Open user menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 text-[11px] font-semibold text-white shadow">
          {ini}
        </span>
        <span className="hidden text-xs font-medium text-foreground sm:block">
          {profile.full_name || profile.email.split("@")[0]}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/40"
          >
            <div className="border-b border-border/60 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/30">
                  {ini}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {profile.full_name || profile.email}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={roleBadge}>
                  <ShieldCheck className="h-3 w-3" />
                  {ROLE_LABEL[profile.role]}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {profile.organization || "—"}
                </span>
              </div>
              {demoMode && (
                <p className="mt-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-200">
                  Demo mode — Supabase not configured
                </p>
              )}
            </div>

            <div className="flex flex-col p-1.5">
              <MenuLink href="/settings" icon={<Settings className="h-4 w-4" />}>
                Settings
              </MenuLink>
              <MenuLink
                href="/dashboard"
                icon={<User className="h-4 w-4" />}
              >
                Dashboard
              </MenuLink>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-secondary/60"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}
