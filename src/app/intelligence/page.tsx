"use client";

import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeBrowser } from "@/features/intelligence/knowledge-browser";
import { ThreatFeed } from "@/features/threat-intel/threat-feed";

export default function IntelligencePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Security Intelligence"
        description="Live threat feed with MITRE ATT&CK mapping, CVE lookup, and the playbook knowledge base. Vector retrieval with keyword fallback."
      />
      <ThreatFeed />
      <KnowledgeBrowser />
    </div>
  );
}
