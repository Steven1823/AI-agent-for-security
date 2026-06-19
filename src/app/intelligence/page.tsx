"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { KnowledgeBrowser } from "@/features/intelligence/knowledge-browser";
import { ThreatFeed } from "@/features/threat-intel/threat-feed";

export default function IntelligencePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Security Intelligence"
        description="Live threat feed with MITRE ATT&CK mapping, CVE lookup, and the playbook knowledge base. Vector retrieval with keyword fallback."
      />
      <PageIntro description="Threat intelligence and RAG-style playbooks. The vector knowledge base falls back to keyword matching if vectors are unavailable, so retrieval never fails silently." />
      <ThreatFeed />
      <KnowledgeBrowser />
    </div>
  );
}
