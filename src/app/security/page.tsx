"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
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
      <PageIntro description="Suspicious activity, auth events, and live threat score. The map visualizes attack origin while the security center tracks blocked traffic and active mitigations." />
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
