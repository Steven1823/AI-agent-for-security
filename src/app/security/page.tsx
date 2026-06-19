"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SecurityCenter } from "@/features/security/security-center";
import { LiveMetricsPanel } from "@/features/metrics/live-metrics-panel";
import { IncidentList } from "@/features/incidents/incident-list";
import { SecurityMap } from "@/features/security-map/security-map";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Security Center"
        description="Real-time threat scoring, attack-source map, and edge defense posture."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SecurityCenter />
        </div>
        <div className="lg:col-span-2">
          <LiveMetricsPanel />
        </div>
      </div>
      <SecurityMap />
      <IncidentList title="Security Events" />
    </div>
  );
}
