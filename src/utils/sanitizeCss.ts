// OWASP A03 — strips CSS patterns that enable stored XSS

const BLOCKED_PATTERNS: RegExp[] = [
  /<script[\s\S]*?>/gi,          // <script ...>
  /<\/script>/gi,                // </script>
  /javascript\s*:/gi,            // javascript:
  /expression\s*\(/gi,           // expression(
  /url\s*\(\s*['"]?\s*javascript/gi, // url(javascript:
  /@import/gi,                   // @import
  /behavior\s*:/gi,              // IE behavior:
  /-moz-binding\s*:/gi,          // Firefox binding:
];

export function sanitizeCss(raw: string): string {
  let result = raw;
  for (const pattern of BLOCKED_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

export function isValidCss(raw: string): boolean {
  return BLOCKED_PATTERNS.every((p) => !p.test(raw));
}
