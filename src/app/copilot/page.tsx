"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CopilotPanel } from "@/features/copilot/copilot-panel";
import { RecommendationsEngine } from "@/features/recommendations/recommendations-engine";

export default function CopilotPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="AI Copilot"
        description="Conversational interface grounded in live incidents, components, and metrics. Every answer cites its evidence."
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <CopilotPanel />
        <RecommendationsEngine />
      </div>
    </div>
  );
}
