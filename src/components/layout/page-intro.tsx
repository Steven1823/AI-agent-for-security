"use client";

import { Info, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * "What this does" panel — sits at the top of every operator page and
 * explains in plain English what the user is looking at and why it matters.
 *
 * Designed to be obvious-on-first-glance: the icon is muted on purpose so
 * it never competes with the page's primary data widgets.
 */
export function PageIntro({
  title,
  description,
  icon: Icon = Info,
  className,
}: {
  title?: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title ?? "What this does"}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
