"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Activity,
  ServerCog,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePulseStore } from "@/lib/store";
import type {
  Criticality,
  MonitoredService,
  MonitorMethod,
  MonitorStatus,
} from "@/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<MonitorStatus, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  failed: "bg-rose-500",
  unknown: "bg-slate-500",
};

const STATUS_LABEL: Record<MonitorStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  failed: "Failed",
  unknown: "Pending",
};

const CRIT_COLOR: Record<Criticality, string> = {
  critical: "text-rose-300",
  high: "text-amber-300",
  medium: "text-sky-300",
  low: "text-slate-300",
};

export default function ServicesPage() {
  const services = usePulseStore((s) => s.monitoredServices);
  const summary = usePulseStore((s) => s.monitorSummary());
  const addService = usePulseStore((s) => s.addService);
  const removeService = usePulseStore((s) => s.removeService);
  const runCheck = usePulseStore((s) => s.runHealthCheck);
  const runAll = usePulseStore((s) => s.runAllHealthChecks);
  const bootstrap = usePulseStore((s) => s.bootstrapMonitor);
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const handleSeed = () => {
    bootstrap();
    toast.success("Demo services seeded");
  };

  const handleRunAll = async () => {
    setBusy("__all__");
    const tid = toast.loading("Running checks on all services…");
    try {
      await runAll();
      toast.update(tid, { kind: "success", title: "All services checked" });
    } catch (err) {
      toast.update(tid, {
        kind: "error",
        title: err instanceof Error ? err.message : "Check failed",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleCheckOne = async (id: string, name: string) => {
    setBusy(id);
    const tid = toast.loading(`Checking ${name}…`);
    try {
      const check = await runCheck(id);
      toast.update(tid, {
        kind: check?.status === "healthy" ? "success" : "error",
        title: `${name}: ${check?.status ?? "unknown"} · ${check?.responseTimeMs ?? 0}ms`,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = (svc: MonitoredService) => {
    removeService(svc.id);
    toast.info(`Removed ${svc.name}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Service Setup"
        description="Manage the APIs PulseGuard watches. Each service is checked every 30 seconds."
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSeed}>
              <Server className="mr-1.5 h-4 w-4" /> Seed demo services
            </Button>
            <Button onClick={handleRunAll} disabled={busy === "__all__"}>
              <RefreshCw
                className={cn(
                  "mr-1.5 h-4 w-4",
                  busy === "__all__" && "animate-spin",
                )}
              />
              Run all checks
            </Button>
          </div>
        }
      />

      <PageIntro
        icon={ServerCog}
        description="Register the endpoints you want PulseGuard to monitor. Each service runs a health check every 30 seconds — three consecutive failures opens an incident and triggers the AI recovery agent. Use the demo:// URL scheme to run deterministic simulations without making real HTTP calls."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Total services" value={summary.total} tone="text-foreground" />
        <SummaryStat label="Healthy" value={summary.healthy} tone="text-emerald-400" />
        <SummaryStat
          label="Degraded / Failed"
          value={summary.degraded + summary.failed}
          tone={
            summary.failed > 0
              ? "text-rose-400"
              : summary.degraded > 0
                ? "text-amber-400"
                : "text-emerald-400"
          }
        />
        <SummaryStat
          label="Avg response"
          value={summary.avgResponseMs}
          suffix="ms"
          tone="text-sky-400"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Monitored services
                </div>
                <h2 className="text-lg font-semibold">
                  {services.length} endpoint{services.length === 1 ? "" : "s"}
                </h2>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-background/40 px-6 py-10 text-center">
                <Server className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No services yet.
                </p>
                <Button className="mt-4" onClick={handleSeed}>
                  Seed demo services
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {services.map((s) => (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="rounded-xl border border-border/40 bg-background/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              STATUS_COLOR[s.status],
                              s.status === "failed" && "animate-pulse",
                            )}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {s.name}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase tracking-wider",
                                  CRIT_COLOR[s.criticality],
                                )}
                              >
                                {s.criticality}
                              </span>
                            </div>
                            <div className="truncate font-mono text-[11px] text-muted-foreground">
                              {s.method} {s.url}
                            </div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                              {s.region} · expect {s.expectedStatus} · timeout{" "}
                              {s.timeoutMs}ms
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right">
                            <Badge
                              variant={
                                s.status === "healthy"
                                  ? "success"
                                  : s.status === "degraded"
                                    ? "warning"
                                    : s.status === "failed"
                                      ? "danger"
                                      : "muted"
                              }
                              className="text-[10px]"
                            >
                              {STATUS_LABEL[s.status]}
                            </Badge>
                            <div className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                              {s.responseTimeMs}ms
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCheckOne(s.id, s.name)}
                            disabled={busy === s.id}
                          >
                            <RefreshCw
                              className={cn(
                                "h-3.5 w-3.5",
                                busy === s.id && "animate-spin",
                              )}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(s)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Card>
        </div>

        <div>
          <AddServiceForm
            onAdd={(svc) => {
              addService(svc);
              toast.success(`${svc.name} added`);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Activity className="h-3 w-3" />
        {label}
      </div>
      <div className={cn("mt-1.5 text-2xl font-bold tabular-nums", tone)}>
        {value}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </Card>
  );
}

function AddServiceForm({
  onAdd,
}: {
  onAdd: (svc: {
    name: string;
    url: string;
    method: MonitorMethod;
    expectedStatus: number;
    timeoutMs: number;
    region: string;
    criticality: Criticality;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [method, setMethod] = useState<MonitorMethod>("GET");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [region, setRegion] = useState("us-east");
  const [criticality, setCriticality] = useState<Criticality>("medium");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("demo://")
    ) {
      setError("URL must start with http://, https://, or demo://");
      return;
    }
    onAdd({
      name: name.trim(),
      url: url.trim(),
      method,
      expectedStatus,
      timeoutMs,
      region: region.trim() || "us-east",
      criticality,
    });
    setName("");
    setUrl("https://");
  };

  return (
    <Card className="p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Add a service
      </div>
      <h2 className="text-lg font-semibold">Register an endpoint</h2>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Main API"
            className="form-input"
          />
        </Field>
        <Field label="URL">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/health"
            className="form-input font-mono text-xs"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Method">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as MonitorMethod)}
              className="form-input"
            >
              <option value="GET">GET</option>
              <option value="HEAD">HEAD</option>
              <option value="POST">POST</option>
            </select>
          </Field>
          <Field label="Expected status">
            <input
              type="number"
              min={100}
              max={599}
              value={expectedStatus}
              onChange={(e) => setExpectedStatus(Number(e.target.value))}
              className="form-input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Timeout (ms)">
            <input
              type="number"
              min={500}
              max={30000}
              step={500}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
              className="form-input"
            />
          </Field>
          <Field label="Region">
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east"
              className="form-input"
            />
          </Field>
        </div>
        <Field label="Criticality">
          <select
            value={criticality}
            onChange={(e) => setCriticality(e.target.value as Criticality)}
            className="form-input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full">
          <Plus className="mr-1.5 h-4 w-4" /> Add service
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Tip: use <code>demo://my-service</code> to add a deterministic
          simulated endpoint that never calls the network.
        </p>
      </form>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}
