/**
 * Redirect Safety Utility
 *
 * Prevents open redirect vulnerabilities and redirect loops across
 * authentication flows.
 *
 * Rules:
 * 1. Must be a relative path starting with a single '/'
 * 2. Must NOT start with '//' (protocol-relative URLs)
 * 3. Must NOT start with '/\\' or contain backslashes (bypasses in some browsers/URL parsers)
 * 4. Must NOT contain CRLF or control characters
 * 5. Must NOT redirect back to the login page itself (prevents infinite redirect loops)
 * 6. Falls back to a safe default path if any check fails
 */

const DEFAULT_REDIRECT = "/dashboard";

export function getSafeRedirectUrl(
  target: unknown,
  fallback: string = DEFAULT_REDIRECT
): string {
  if (typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Empty string check
  if (!trimmed) {
    return fallback;
  }

  // Must begin with single '/' and not with '//' or '/\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject any backslashes anywhere in the target to avoid Windows path / URL parser discrepancies
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Reject control characters and newlines (CRLF injection prevention)
  if (/[\r\n\t\0]/.test(trimmed)) {
    return fallback;
  }

  // Parse as a URL relative to a dummy base to validate structure safely
  try {
    const dummyOrigin = "https://safe.local";
    const parsed = new URL(trimmed, dummyOrigin);

    // Ensure the parsed origin matches the dummy origin (guarantees relative path)
    if (parsed.origin !== dummyOrigin) {
      return fallback;
    }

    // Ensure pathname still starts with a single '/'
    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return fallback;
    }

    // Prevent redirect loops: if the destination is /login, return fallback
    if (parsed.pathname === "/login" || parsed.pathname.startsWith("/login/")) {
      return fallback;
    }

    // Return the safe relative path including search query and hash if present
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
