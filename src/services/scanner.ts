import type { CyberInput, ScanFinding, ScanResult, Severity } from "@/types";

/**
 * Deterministic, safe simulated scanner. Produces plausible recon data
 * keyed off the target string — no real network calls are ever made.
 */
export function simulatedScan(input: CyberInput): ScanResult {
  const seed = hash(input.target || input.raw);
  const rng = mulberry32(seed);

  const PORT_POOL = [21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 5432, 6379, 8080, 8443, 9200, 11211, 27017];
  const SERVICE_POOL = ["nginx 1.25", "openssh 9.6", "postfix 3.7", "redis 7.2", "postgres 15.4", "mongo 6.0", "elasticsearch 8.11", "haproxy 2.8"];

  const portCount = 3 + Math.floor(rng() * 4);
  const openPorts = pickN(PORT_POOL, portCount, rng).sort((a, b) => a - b);
  const services = pickN(SERVICE_POOL, Math.min(3, portCount), rng);

  const tlsGrades = ["A+", "A", "A-", "B", "C", "F"];
  const tlsGrade = tlsGrades[Math.floor(rng() * tlsGrades.length)];

  const dnsRecords = [
    `A    ${input.target} -> 203.0.113.${1 + Math.floor(rng() * 250)}`,
    `MX   ${input.target} -> mail.${input.target}`,
    `TXT  ${input.target} -> "v=spf1 include:_spf.${input.target} ~all"`,
  ];

  const headers: Record<string, string> = {
    Server: services[0] ?? "nginx",
    "Strict-Transport-Security": tlsGrade.startsWith("A")
      ? "max-age=31536000; includeSubDomains"
      : "missing",
    "X-Frame-Options": rng() > 0.5 ? "DENY" : "missing",
    "Content-Security-Policy": rng() > 0.6 ? "default-src 'self'" : "missing",
  };

  const findings: ScanFinding[] = [];
  if (openPorts.includes(21)) {
    findings.push({
      category: "Exposed FTP",
      detail: "Port 21 (FTP) is open and accepting plaintext credentials.",
      severity: "high",
    });
  }
  if (openPorts.includes(3306) || openPorts.includes(5432) || openPorts.includes(27017) || openPorts.includes(6379)) {
    findings.push({
      category: "Database exposed",
      detail: "A database service is reachable from the public internet.",
      severity: "critical",
    });
  }
  if (!tlsGrade.startsWith("A")) {
    findings.push({
      category: "Weak TLS",
      detail: `TLS configuration graded ${tlsGrade}. Weak ciphers may be enabled.`,
      severity: tlsGrade === "F" ? "high" : "medium",
    });
  }
  if (headers["Strict-Transport-Security"] === "missing") {
    findings.push({
      category: "Missing HSTS",
      detail: "Strict-Transport-Security header not set; downgrade attacks possible.",
      severity: "low",
    });
  }
  if (headers["Content-Security-Policy"] === "missing") {
    findings.push({
      category: "Missing CSP",
      detail: "No Content-Security-Policy header; XSS surface increased.",
      severity: "medium",
    });
  }

  return {
    target: input.target,
    openPorts,
    services,
    tlsGrade,
    dnsRecords,
    headers,
    findings,
    source: "scanner",
  };
}

/** Used when scanner is disabled — still emits a minimal evidence object. */
export function emptyScan(input: CyberInput): ScanResult {
  return {
    target: input.target,
    openPorts: [],
    services: [],
    tlsGrade: "unknown",
    dnsRecords: [],
    headers: {},
    findings: [
      {
        category: "Scanner unavailable",
        detail:
          "Recon scanner is offline; analysis proceeded without live evidence.",
        severity: "low",
      },
    ],
    source: "fallback",
  };
}

export function maxSeverity(findings: ScanFinding[]): Severity {
  const rank: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  let best: Severity = "low";
  for (const f of findings) {
    if (rank[f.severity] > rank[best]) best = f.severity;
  }
  return best;
}

// ---------- helpers ----------

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rng() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}
