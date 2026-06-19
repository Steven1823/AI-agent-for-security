"use client";

import { Brain, Database, RotateCcw, Zap } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { VoiceOpsCenter } from "@/features/voice/voice-ops-center";

export default function SettingsPage() {
  const reset = usePulseStore((s) => s.reset);
  const runDisaster = usePulseStore((s) => s.runDisasterScenario);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Settings"
        description="Configure voice alerts, integrations, and demo controls."
      />

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
            subtitle="Optional persistence. Uses in-memory temporal store by default."
            connected={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="gradient" onClick={() => runDisaster()}>
            <Zap className="h-4 w-4" /> Run Disaster Scenario
          </Button>
          <Button variant="outline" onClick={() => reset()}>
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
