import type { KnowledgeMatch, Playbook } from "@/types";

/**
 * Tiny in-memory knowledge base of cybersecurity playbooks. Acts as the
 * source for a RAG-style retrieval: we score by simulated cosine similarity
 * over a bag-of-words "embedding"; if that fails we fall back to a simple
 * keyword overlap match so the system always returns guidance.
 */
export const PLAYBOOKS: Playbook[] = [
  {
    id: "pb-001",
    title: "Exposed Database Containment",
    tags: ["database", "exposure", "postgres", "mysql", "mongodb", "redis", "exfiltration"],
    summary: "A database port is reachable from the public internet.",
    steps: [
      "Restrict the database port at the perimeter firewall and security group.",
      "Rotate all database credentials and revoke long-lived tokens.",
      "Enable encryption at rest and TLS in transit if not already on.",
      "Audit access logs for the past 30 days for anomalous reads or dumps.",
    ],
  },
  {
    id: "pb-002",
    title: "Credential Stuffing / Brute Force Response",
    tags: ["brute force", "credential stuffing", "login", "auth", "ssh", "password"],
    summary: "Repeated authentication failures from clustered sources.",
    steps: [
      "Enable adaptive rate limiting per IP and per account.",
      "Force step-up MFA for all sessions originating from suspect ASNs.",
      "Invalidate active sessions for any account with > 5 failed attempts in 60s.",
      "Subscribe targeted accounts to a credential-leak monitoring feed.",
    ],
  },
  {
    id: "pb-003",
    title: "DDoS / Volumetric Surge Mitigation",
    tags: ["ddos", "volumetric", "flood", "surge", "edge", "rate limit"],
    summary: "Anomalous traffic burst saturating the edge.",
    steps: [
      "Engage upstream scrubbing provider and shift traffic via Anycast.",
      "Apply per-IP rate limits at the edge WAF with adaptive thresholds.",
      "Block offending ASNs at the BGP boundary if attribution is confirmed.",
      "Scale stateless tiers horizontally and enable cache shielding.",
    ],
  },
  {
    id: "pb-004",
    title: "Phishing / Malicious Domain Takedown",
    tags: ["phishing", "domain", "lookalike", "typosquat", "abuse"],
    summary: "Lookalike domain impersonating the brand observed in the wild.",
    steps: [
      "Capture WHOIS, hosting provider, and certificate evidence.",
      "File abuse reports with the registrar, host, and certificate authority.",
      "Block the domain at the corporate DNS resolver and mail gateway.",
      "Notify employees and customers via the standard fraud-alert channel.",
    ],
  },
  {
    id: "pb-005",
    title: "Malware C2 Beaconing Containment",
    tags: ["malware", "c2", "command and control", "beacon", "endpoint", "edr"],
    summary: "Endpoint observed beaconing to a known command-and-control host.",
    steps: [
      "Isolate the affected endpoint at the network layer via EDR.",
      "Pull a memory image and full disk snapshot for forensics.",
      "Block the C2 domain and IP across DNS and egress firewall.",
      "Hunt for the indicator across the fleet and rotate any exposed secrets.",
    ],
  },
  {
    id: "pb-006",
    title: "TLS Misconfiguration Remediation",
    tags: ["tls", "ssl", "hsts", "cipher", "downgrade", "certificate"],
    summary: "Weak TLS configuration exposes downgrade and interception risk.",
    steps: [
      "Disable TLS 1.0/1.1 and any ciphers without forward secrecy.",
      "Enable HSTS with includeSubDomains and a 1-year max-age.",
      "Rotate certificates and verify chain trust with multiple validators.",
      "Add automated TLS posture checks to CI to prevent regression.",
    ],
  },
  {
    id: "pb-007",
    title: "Generic Incident Triage",
    tags: ["unknown", "triage", "incident", "alert", "investigation"],
    summary: "Default triage playbook when the signal is ambiguous.",
    steps: [
      "Classify the alert against the MITRE ATT&CK matrix.",
      "Pull telemetry from the affected asset for the past 24 hours.",
      "Open an incident channel and assign an on-call IC.",
      "Decide between containment, monitoring, or false-positive disposition.",
    ],
  },
];

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "is", "for", "in", "on", "at", "with",
  "from", "as", "by", "be", "this", "that", "it", "are", "was", "we", "i", "you",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t) && t.length > 2);
}

/** Simulated vector retrieval — TF-style cosine over tags + summary tokens. */
export function vectorSearch(query: string, top = 3): KnowledgeMatch[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const scored = PLAYBOOKS.map((pb) => {
    const corpus = tokenize(`${pb.title} ${pb.summary} ${pb.tags.join(" ")}`);
    const corpusSet = new Set(corpus);
    const overlap = qTokens.filter((t) => corpusSet.has(t)).length;
    const denom = Math.sqrt(qTokens.length) * Math.sqrt(corpus.length || 1);
    const score = denom > 0 ? overlap / denom : 0;
    return { playbook: pb, score, via: "vector" as const };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

/** Keyword fallback when vector search returns nothing useful. */
export function keywordSearch(query: string, top = 3): KnowledgeMatch[] {
  const q = query.toLowerCase();
  const scored = PLAYBOOKS.map((pb) => {
    const hits = pb.tags.filter((t) => q.includes(t)).length;
    return { playbook: pb, score: hits / (pb.tags.length || 1), via: "keyword" as const };
  });

  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (hits.length > 0) return hits.slice(0, top);

  // Ultimate floor: generic triage playbook so output is never empty.
  const generic = PLAYBOOKS.find((p) => p.id === "pb-007");
  return generic ? [{ playbook: generic, score: 0.1, via: "keyword" }] : [];
}

/**
 * Resilient retrieval: try vector → keyword → generic. Disabling the vector
 * DB component forces the keyword path immediately.
 */
export function retrievePlaybooks(
  query: string,
  vectorDisabled: boolean,
  top = 3,
): KnowledgeMatch[] {
  if (!vectorDisabled) {
    const vec = vectorSearch(query, top);
    if (vec.length > 0) return vec;
  }
  return keywordSearch(query, top);
}
