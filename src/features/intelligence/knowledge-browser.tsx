"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { PLAYBOOKS, retrievePlaybooks } from "@/services/knowledge";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function KnowledgeBrowser() {
  const [query, setQuery] = useState("");
  const vectorDisabled = usePulseStore(
    (s) => s.components.vector_db.status === "offline",
  );

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return retrievePlaybooks(query, vectorDisabled, 5);
  }, [query, vectorDisabled]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-sky-400" />
            RAG Knowledge Retrieval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search playbooks — e.g. exposed database, brute force, ddos…"
              className="w-full rounded-xl border border-border/60 bg-background/40 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
            Retrieval mode:
            <Badge variant={vectorDisabled ? "warning" : "success"}>
              {vectorDisabled ? "Keyword fallback (vector DB offline)" : "Vector"}
            </Badge>
          </p>

          {query.trim() && (
            <ul className="space-y-2">
              {matches.length === 0 ? (
                <li className="rounded-xl border border-border/40 bg-secondary/20 p-3 text-sm text-muted-foreground">
                  No matches. Try a different query.
                </li>
              ) : (
                matches.map((m) => (
                  <li
                    key={m.playbook.id}
                    className="rounded-xl border border-border/40 bg-secondary/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {m.playbook.title}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={m.via === "vector" ? "default" : "warning"}>
                          {m.via}
                        </Badge>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {(m.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.playbook.summary}
                    </p>
                  </li>
                ))
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-400" />
            Playbook Library ({PLAYBOOKS.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {PLAYBOOKS.map((pb) => (
              <li
                key={pb.id}
                className={cn(
                  "rounded-xl border border-border/40 bg-secondary/20 p-4",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{pb.title}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {pb.id}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pb.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pb.tags.map((t) => (
                    <Badge key={t} variant="muted">
                      {t}
                    </Badge>
                  ))}
                </div>
                <ol className="mt-3 space-y-1 text-sm text-foreground/90">
                  {pb.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-violet-400">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
