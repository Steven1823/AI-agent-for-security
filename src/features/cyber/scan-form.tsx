"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Radar, Sparkles } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SAMPLES = [
  { label: "Domain", value: "evil-bank-login.example.com" },
  { label: "IP", value: "198.51.100.42" },
  {
    label: "Log",
    value: `[2026-06-19 10:31:02] [WARN] auth: 87 failed logins for admin@example.com from 198.51.100.42\n[2026-06-19 10:31:04] [ERROR] auth: account locked after brute force burst`,
  },
  {
    label: "Alert JSON",
    value: JSON.stringify(
      {
        alert: "C2 beaconing detected",
        host: "checkout-prod-7",
        target: "checkout-prod-7",
        signature: "MALWARE-COBALTSTRIKE-BEACON",
        severity: "high",
      },
      null,
      2,
    ),
  },
  {
    label: "Natural Language",
    value:
      "Our payments API is throwing intermittent 502s and customers are complaining about double charges.",
  },
];

export function ScanForm() {
  const [text, setText] = useState("");
  const analyzing = usePulseStore((s) => s.analyzing);
  const analyze = usePulseStore((s) => s.analyzeCyber);

  async function submit() {
    if (!text.trim() || analyzing) return;
    await analyze(text.trim());
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-sky-400" />
          Cyber Incident Analyzer
        </CardTitle>
        <Badge variant="accent">
          <Sparkles className="h-3 w-3" /> Safe Simulated Recon
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a domain, IP, log line, alert JSON, or describe the incident in plain English…"
          rows={6}
          className={cn(
            "w-full resize-y rounded-xl border border-border/60 bg-background/40 p-3 font-mono text-sm leading-relaxed text-foreground/90 placeholder:text-muted-foreground",
            "focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30",
          )}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Samples:
          </span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setText(s.value)}
              className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-white/10 hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>

        <motion.div whileTap={{ scale: 0.99 }}>
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={!text.trim() || analyzing}
            onClick={submit}
          >
            {analyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Radar className="h-5 w-5" />
            )}
            {analyzing ? "Analyzing…" : "Run Safe Analysis"}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
