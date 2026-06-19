"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useVoice } from "@/hooks/useVoice";
import { useMetricsTicker } from "@/hooks/useMetrics";

// Routes that should render WITHOUT the operator sidebar / topbar / mobile
// nav. These have their own chrome (landing page, auth pages).
const BARE_PATHS = new Set<string>(["/", "/login", "/signup"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_PATHS.has(pathname);

  // Voice + metrics ticker are operator-only — never run on landing/auth.
  useVoice();
  useMetricsTicker();

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="aurora" />
      <div className="fixed inset-0 -z-10 grid-bg" />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-6 md:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — show the 5 most important destinations */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/60 bg-background/80 px-2 py-2 backdrop-blur-xl lg:hidden">
        {[
          NAV_ITEMS[0], // Dashboard
          NAV_ITEMS[1], // Copilot
          NAV_ITEMS[3], // Analyzer
          NAV_ITEMS[6], // Autonomous
          NAV_ITEMS[2], // Executive
        ].map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px]",
                active ? "text-sky-400" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
