"use client";

import { cn } from "@/lib/utils";

interface RingProgressProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  colorClass?: string;
  trackClass?: string;
}

export function RingProgress({
  value,
  size = 140,
  stroke = 12,
  label,
  sublabel,
  colorClass = "stroke-sky-400",
  trackClass = "stroke-secondary/60",
}: RingProgressProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000 ease-out", colorClass)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-3xl font-bold tracking-tight">{label}</span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
