"use client";

/**
 * Lightweight zero-dependency password strength meter.
 *
 * 0 — too short              (red)
 * 1 — weak (one class)        (red)
 * 2 — fair (two classes)      (amber)
 * 3 — strong (three classes)  (sky)
 * 4 — excellent (all + 12+)   (emerald)
 */
import { cn } from "@/lib/utils";

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
}

export function scorePassword(pw: string): PasswordStrengthResult {
  if (!pw) return { score: 0, label: "Empty", hint: "Enter a password." };
  if (pw.length < 8)
    return { score: 0, label: "Too short", hint: "Use at least 8 characters." };

  let classes = 0;
  if (/[a-z]/.test(pw)) classes++;
  if (/[A-Z]/.test(pw)) classes++;
  if (/[0-9]/.test(pw)) classes++;
  if (/[^A-Za-z0-9]/.test(pw)) classes++;

  if (classes <= 1)
    return {
      score: 1,
      label: "Weak",
      hint: "Add uppercase, numbers, and a symbol.",
    };
  if (classes === 2)
    return { score: 2, label: "Fair", hint: "Add more character types." };
  if (classes === 3 && pw.length < 12)
    return { score: 3, label: "Strong", hint: "Add a symbol or extend length." };
  if (classes === 4 || pw.length >= 12)
    return { score: 4, label: "Excellent", hint: "Looks great." };
  return { score: 3, label: "Strong", hint: "Good password." };
}

const COLORS = [
  "bg-red-500",
  "bg-red-400",
  "bg-amber-400",
  "bg-sky-400",
  "bg-emerald-400",
];

const TEXT_COLORS = [
  "text-red-400",
  "text-red-400",
  "text-amber-300",
  "text-sky-300",
  "text-emerald-300",
];

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, hint } = scorePassword(password);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < score ? COLORS[score] : "bg-secondary/60",
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("font-medium", TEXT_COLORS[score])}>{label}</span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}
