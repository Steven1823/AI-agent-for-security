import type {
  CyberReport,
  Incident,
  ThreatFeedItem,
} from "@/types";
import { uid } from "@/lib/utils";
import { lookupCves, mitreForCyber, mitreForIncident } from "./mitre";

/**
 * Build a threat feed entirely from the *current* store state — incidents and
 * cyber reports. This means every row in the UI is grounded in a real piece of
 * data the operator can navigate to, not a random mock.
 */
export function buildThreatFeed(
  incidents: Incident[],
  cyberReports: CyberReport[],
): ThreatFeedItem[] {
  const items: ThreatFeedItem[] = [];

  for (const r of cyberReports) {
    items.push({
      id: uid("tf"),
      ts: r.createdAt,
      severity: r.severity,
      source: "Cyber Analyzer",
      indicator: r.input.target,
      message: r.executiveSummary || r.diagnosis,
      actor: r.threat.knownActor,
      mitre: mitreForCyber(r.input.kind, r.threat),
      cves: lookupCves({
        services: r.scan.services,
        categories: r.threat.categories,
        ports: r.scan.openPorts,
      }),
      origin: "cyber_report",
      originId: r.id,
    });
  }

  for (const i of incidents) {
    items.push({
      id: uid("tf"),
      ts: i.createdAt,
      severity: i.severity,
      source: incidentSource(i),
      indicator: i.service,
      message: i.diagnosis ?? i.title,
      mitre: mitreForIncident(i.type),
      cves:
        i.type === "security_attack"
          ? lookupCves({ categories: ["ddos"] })
          : i.type === "api_failure"
          ? lookupCves({ categories: ["rce"] })
          : [],
      origin: "incident",
      originId: i.id,
    });
  }

  // Newest first.
  return items.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
}

function incidentSource(i: Incident): string {
  switch (i.type) {
    case "security_attack":
      return "Edge Firewall";
    case "api_failure":
      return "API Gateway";
    case "database_failure":
      return "Database Cluster";
    case "high_latency":
      return "Service Mesh";
  }
}

/** Active threat actors observed across the feed. */
export function distinctActors(feed: ThreatFeedItem[]): string[] {
  const set = new Set<string>();
  for (const f of feed) if (f.actor) set.add(f.actor);
  return Array.from(set);
}
