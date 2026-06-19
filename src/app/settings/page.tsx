"use client";

import { Brain, Database, RotateCcw, Zap, ShieldCheck, LogOut, Mail } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { VoiceOpsCenter } from "@/features/voice/voice-ops-center";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL, ROLE_DESCRIPTION } from "@/types/auth";

export default function SettingsPage() {
  const reset = usePulseStore((s) => s.reset);
  const runDisaster = usePulseStore((s) => s.runDisasterScenario);
  const { profile, demoMode, can, signOut } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your account, voice alerts, integrations, and demo controls."
      />

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/30">
                  {(profile.full_name || profile.email)
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium">{profile.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    <Mail className="mr-1 inline h-3 w-3" />
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    profile.role === "admin"
                      ? "danger"
                      : profile.role === "engineer"
                        ? "default"
                        : "muted"
                  }
                >
                  <ShieldCheck className="h-3 w-3" />
                  {ROLE_LABEL[profile.role]}
                </Badge>
                {profile.organization && (
                  <Badge variant="muted">{profile.organization}</Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {ROLE_DESCRIPTION[profile.role]}
            </p>
            {!demoMode && (
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <VoiceOpsCenter />

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <IntegrationRow
            icon={<Brain className="h-4 w-4 text-violet-400" />}
            title="OpenAI"
            subtitle="Incident analysis. Falls back to built-in SRE engine if no key."
            connected={false}
          />
          <IntegrationRow
            icon={<Database className="h-4 w-4 text-emerald-400" />}
            title="Supabase"
            subtitle={
              demoMode
                ? "Not configured — running in demo mode with in-memory store."
                : "Auth + persistence active."
            }
            connected={!demoMode}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="gradient"
            onClick={() => runDisaster()}
            disabled={!can.runChaos}
            title={
              can.runChaos
                ? "Run an end-to-end disaster scenario."
                : "Viewer role — chaos disabled."
            }
          >
            <Zap className="h-4 w-4" /> Run Disaster Scenario
          </Button>
          <Button
            variant="outline"
            onClick={() => reset()}
            disabled={!can.editSettings}
            title={
              can.editSettings
                ? "Reset all in-memory state."
                : "Admin only."
            }
          >
            <RotateCcw className="h-4 w-4" /> Reset Environment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationRow({
  icon,
  title,
  subtitle,
  connected,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-secondary/20 p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Badge variant={connected ? "success" : "muted"}>
        <StatusDot tone={connected ? "success" : "muted"} pulse={connected} />
        {connected ? "Connected" : "Fallback"}
      </Badge>
    </div>
  );
}
