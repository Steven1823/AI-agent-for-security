"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  ExternalLink,
  Layers,
  Radar,
  Skull,
  Target,
} from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_STYLE } from "@/lib/constants";
import { buildThreatFeed, distinctActors } from "@/services/threat-feed";
import { cn, formatDateTime } from "@/lib/utils";

export function ThreatFeed() {
  const incidents = usePulseStore((s) => s.incidents);
  const reports = usePulseStore((s) => s.cyberReports);

  const feed = useMemo(
    () => buildThreatFeed(incidents, reports),
    [incidents, reports],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const active = feed.find((f) => f.id === selected) ?? feed[0] ?? null;
  const actors = distinctActors(feed);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-sky-400" />
          Threat Intelligence Feed
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Badge variant="muted">{feed.length} signals</Badge>
          {actors.length > 0 && (
            <Badge variant="accent" title={actors.join(", ")}>
              <Skull className="h-3 w-3" />
              {actors.length} actor{actors.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {feed.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No threat signals yet. Trigger an incident or run the Analyzer to
            populate the feed.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            {/* Feed */}
            <div className="space-y-2">
              {feed.slice(0, 8).map((f) => {
                const sev = SEVERITY_STYLE[f.severity];
                const isActive = (active?.id ?? "") === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f.id)}
                    className={cn(
                      "w-full rounded-xl border bg-secondary/30 p-3 text-left transition-colors hover:border-sky-400/40",
                      isActive
                        ? "border-sky-400/60 bg-sky-500/5"
                        : "border-border/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={sev.badge}>{sev.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {f.source}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatDateTime(f.ts)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">
                      {f.indicator}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {f.message}
                    </p>
                    {f.actor && (
                      <p className="mt-1 text-[11px] text-violet-300">
                        Linked actor: {f.actor}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected detail */}
            <div>
              {active ? <Detail itemId={active.id} /> : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Detail({ itemId }: { itemId: string }) {
  const incidents = usePulseStore((s) => s.incidents);
  const reports = usePulseStore((s) => s.cyberReports);
  const feed = useMemo(
    () => buildThreatFeed(incidents, reports),
    [incidents, reports],
  );
  const f = feed.find((x) => x.id === itemId);
  if (!f) return null;
  const sev = SEVERITY_STYLE[f.severity];

  return (
    <motion.div
      key={f.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-sky-400" />
          <p className="font-medium">{f.indicator}</p>
        </div>
        <Badge variant={sev.badge}>{sev.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{f.message}</p>

      <section>
        <p className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-3 w-3" /> MITRE ATT&amp;CK
        </p>
        {f.mitre.length === 0 ? (
          <p className="text-xs text-muted-foreground">No mapped techniques.</p>
        ) : (
          <ul className="space-y-1">
            {f.mitre.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md bg-background/30 px-2 py-1.5 text-xs"
              >
                <span>
                  <span className="font-mono text-sky-300">{t.id}</span>{" "}
                  <span className="text-foreground">{t.name}</span>
                  <span className="ml-1 text-muted-foreground">· {t.tactic}</span>
                </span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-sky-300"
                  aria-label={`Open ${t.id} on attack.mitre.org`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Bug className="h-3 w-3" /> CVE Lookup
        </p>
        {f.cves.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No matching CVEs in the catalogue.
          </p>
        ) : (
          <ul className="space-y-1">
            {f.cves.map((c) => (
              <li
                key={c.id}
                className="rounded-md bg-background/30 px-2 py-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-300">{c.id}</span>
                  <Badge
                    variant={
                      c.severity === "critical"
                        ? "critical"
                        : c.severity === "high"
                        ? "danger"
                        : "warning"
                    }
                  >
                    CVSS {c.cvss.toFixed(1)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-foreground">{c.title}</p>
                <p className="text-muted-foreground">{c.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {f.actor && (
        <section className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-violet-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Attributed to threat actor <strong>{f.actor}</strong>
          </div>
        </section>
      )}
    </motion.div>
  );
}
