"use client";

import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "primary" | "muted";

const TONE: Record<Tone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  primary: "bg-sky-400",
  muted: "bg-muted-foreground",
};

export function StatusDot({
  tone = "primary",
  pulse = true,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-ring",
            TONE[tone],
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          TONE[tone],
        )}
      />
    </span>
  );
}
