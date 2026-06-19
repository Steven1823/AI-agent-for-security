import type {
  CveRecord,
  CyberInputKind,
  IncidentType,
  MitreTechnique,
  Severity,
  ThreatIntel,
} from "@/types";

/**
 * Curated subset of MITRE ATT&CK techniques relevant to the incident /
 * threat surface we simulate. Keeps the demo grounded in real technique IDs.
 */
const T = (
  id: string,
  name: string,
  tactic: string,
): MitreTechnique => ({
  id,
  name,
  tactic,
  url: `https://attack.mitre.org/techniques/${id}/`,
});

export const MITRE: Record<string, MitreTechnique> = {
  T1110: T("T1110", "Brute Force", "Credential Access"),
  T1499: T("T1499", "Endpoint Denial of Service", "Impact"),
  T1498: T("T1498", "Network Denial of Service", "Impact"),
  T1566: T("T1566", "Phishing", "Initial Access"),
  T1071: T("T1071", "Application Layer Protocol (C2)", "Command and Control"),
  T1190: T("T1190", "Exploit Public-Facing Application", "Initial Access"),
  T1078: T("T1078", "Valid Accounts", "Initial Access"),
  T1059: T("T1059", "Command and Scripting Interpreter", "Execution"),
  T1041: T("T1041", "Exfiltration Over C2 Channel", "Exfiltration"),
  T1565: T("T1565", "Data Manipulation", "Impact"),
  T1213: T("T1213", "Data from Information Repositories", "Collection"),
  T1486: T("T1486", "Data Encrypted for Impact (Ransomware)", "Impact"),
};

/** Map an incident type to its likely ATT&CK techniques. */
export function mitreForIncident(type: IncidentType): MitreTechnique[] {
  switch (type) {
    case "security_attack":
      return [MITRE.T1498, MITRE.T1499, MITRE.T1190];
    case "api_failure":
      return [MITRE.T1499, MITRE.T1190];
    case "database_failure":
      return [MITRE.T1565, MITRE.T1213];
    case "high_latency":
      return [MITRE.T1499];
    default:
      return [];
  }
}

/** Map a cyber input kind + categories to ATT&CK techniques. */
export function mitreForCyber(
  kind: CyberInputKind,
  threat: ThreatIntel,
): MitreTechnique[] {
  const cats = threat.categories.map((c) => c.toLowerCase());
  const out: MitreTechnique[] = [];
  const push = (t: MitreTechnique) => {
    if (!out.find((x) => x.id === t.id)) out.push(t);
  };

  if (kind === "domain" || cats.some((c) => c.includes("phish"))) push(MITRE.T1566);
  if (cats.some((c) => c.includes("c2") || c.includes("command"))) {
    push(MITRE.T1071);
    push(MITRE.T1041);
  }
  if (cats.some((c) => c.includes("brute") || c.includes("credential"))) {
    push(MITRE.T1110);
    push(MITRE.T1078);
  }
  if (cats.some((c) => c.includes("ddos") || c.includes("flood"))) {
    push(MITRE.T1498);
    push(MITRE.T1499);
  }
  if (cats.some((c) => c.includes("exfil"))) push(MITRE.T1041);
  if (cats.some((c) => c.includes("ransom"))) push(MITRE.T1486);
  if (cats.some((c) => c.includes("exploit") || c.includes("rce"))) push(MITRE.T1190);

  // Always provide at least one mapping so the UI never empty-states.
  if (out.length === 0) push(MITRE.T1078);
  return out;
}

// ---------- Simulated CVE catalogue ----------

const CVE_LIB: CveRecord[] = [
  {
    id: "CVE-2024-3094",
    title: "xz-utils backdoor in liblzma",
    cvss: 10.0,
    severity: "critical",
    summary: "Malicious code in xz upstream tarballs enables SSH bypass.",
    affected: ["openssh-server", "linux"],
  },
  {
    id: "CVE-2023-44487",
    title: "HTTP/2 Rapid Reset DDoS",
    cvss: 7.5,
    severity: "high",
    summary: "Stream cancellation flood causes resource exhaustion at edge.",
    affected: ["nginx", "envoy", "go", "node"],
  },
  {
    id: "CVE-2024-21412",
    title: "Windows SmartScreen Bypass",
    cvss: 8.1,
    severity: "high",
    summary: "Internet Shortcut files bypass Mark-of-the-Web prompt.",
    affected: ["windows"],
  },
  {
    id: "CVE-2024-6387",
    title: "OpenSSH regreSSHion RCE",
    cvss: 8.1,
    severity: "high",
    summary: "Signal handler race condition in sshd permits remote root.",
    affected: ["openssh", "linux"],
  },
  {
    id: "CVE-2023-50164",
    title: "Apache Struts2 File Upload RCE",
    cvss: 9.8,
    severity: "critical",
    summary: "Path traversal in upload handler permits arbitrary write + RCE.",
    affected: ["struts2", "java"],
  },
  {
    id: "CVE-2024-23897",
    title: "Jenkins CLI Arbitrary File Read",
    cvss: 9.8,
    severity: "critical",
    summary: "Args4j parser exposes filesystem to unauthenticated callers.",
    affected: ["jenkins"],
  },
  {
    id: "CVE-2024-4577",
    title: "PHP CGI Argument Injection",
    cvss: 9.8,
    severity: "critical",
    summary: "Windows PHP-CGI argument injection enables RCE on default installs.",
    affected: ["php", "windows"],
  },
];

/** Deterministic CVE lookup — match by service / category / port. */
export function lookupCves(args: {
  services?: string[];
  categories?: string[];
  ports?: number[];
}): CveRecord[] {
  const services = (args.services ?? []).map((s) => s.toLowerCase());
  const cats = (args.categories ?? []).map((c) => c.toLowerCase());
  const out: CveRecord[] = [];

  for (const cve of CVE_LIB) {
    const hit =
      cve.affected.some((a) => services.some((s) => s.includes(a))) ||
      cats.some((c) => c.includes("ddos")) && cve.id === "CVE-2023-44487" ||
      cats.some((c) => c.includes("rce") || c.includes("exploit")) &&
        (cve.id === "CVE-2024-4577" || cve.id === "CVE-2023-50164");
    if (hit) out.push(cve);
  }

  // Floor: always show at least one relevant CVE for high-risk traffic.
  if (out.length === 0 && cats.some((c) => c.includes("ddos"))) {
    out.push(CVE_LIB[1]);
  }
  return out.slice(0, 4);
}

export function severityFromCvss(cvss: number): Severity {
  if (cvss >= 9) return "critical";
  if (cvss >= 7) return "high";
  if (cvss >= 4) return "medium";
  return "low";
}
