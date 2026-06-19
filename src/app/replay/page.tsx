"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { DisasterReplay } from "@/features/replay/disaster-replay";
import { IncidentInvestigator } from "@/features/ai-investigator/incident-investigator";

export default function ReplayPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Disaster Replay"
        description="Walk through any past incident step by step. See exactly what the AI detected, decided, and recovered � with confidence at each turn."
      />
      <PageIntro description="Replay any past incident step by step. See exactly what the AI detected, what it decided, why it picked a recovery action, and how it resolved." />
      <DisasterReplay />
      <IncidentInvestigator />
    </div>
  );
}
