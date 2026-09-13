import type { Vulnerability } from "@/types/vulnerability";

const KEYWORD_RECOMMENDATIONS: [RegExp, string][] = [
  [/sql injection/i, "Use parameterized queries or an ORM with bound parameters instead of string-concatenated SQL. Validate and allow-list input where dynamic SQL cannot be avoided."],
  [/cross-site scripting|\bxss\b/i, "Encode all user-supplied output for the rendering context (HTML, attribute, or JS) and adopt a Content-Security-Policy to limit script execution."],
  [/hard-?coded|hardcoded/i, "Remove the credential from source control, rotate it immediately, and load secrets from a managed vault or environment-scoped secret store."],
  [/command injection/i, "Avoid invoking a shell with untrusted input — use language-native APIs (e.g. an argument-list based process call) and validate or allow-list input."],
  [/deserialization/i, "Avoid deserializing untrusted data with native object deserializers; use a safe, schema-validated format (e.g. JSON) or an allow-listed class loader."],
  [/reflection/i, "Avoid instantiating classes from user-controlled input; validate against an explicit allow-list of permitted types."],
  [/authentication/i, "Enforce rate limiting and account lockout on authentication endpoints, and re-validate token signature and expiry on every refresh."],
  [/security headers?/i, "Add the missing security headers (Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options) at the web server or gateway layer."],
  [/access control|direct object reference|insecure api/i, "Enforce server-side authorization on every request, verifying the authenticated user owns or is entitled to the requested resource."],
];

/** Best-effort remediation guidance derived from the finding's CWE/title, with a source-type fallback. */
export function getRecommendation(vuln: Vulnerability): string {
  if (vuln.findingType === "SCA" && vuln.packageName && vuln.fixedVersion) {
    return `Upgrade ${vuln.packageName} to version ${vuln.fixedVersion} or later.`;
  }

  const haystack = `${vuln.cwe ?? ""} ${vuln.title}`;
  for (const [pattern, advice] of KEYWORD_RECOMMENDATIONS) {
    if (pattern.test(haystack)) return advice;
  }

  if (vuln.findingType === "SAST") {
    return "Review the vulnerable code path with the application security team and remediate per secure coding guidelines before the next release.";
  }
  if (vuln.findingType === "DAST") {
    return "Validate the finding against the live application and apply input validation, output encoding, or access control fixes as appropriate.";
  }
  if (vuln.findingType === "SCA") {
    return "Upgrade the vulnerable dependency to a patched release, or apply a compensating control if no fix is available yet.";
  }
  if (vuln.affectedComponent) {
    return `Upgrade or patch ${vuln.affectedComponent} to the latest vendor-supported release. Validate remediation by re-scanning post-change.`;
  }
  return "Apply the vendor patch for this finding and restart the affected service. Validate remediation by re-scanning post-change.";
}
