/**
 * Security utilities — input validation, sanitization, rate limiting helpers.
 */

/** Allowed characters for human names (letters, spaces, hyphens, apostrophes, CJK). */
const NAME_RE = /^[\p{L}\p{M}\s\-'·]{1,60}$/u;

/** Allowed characters for team names — similar to names but allows dots and ampersands. */
const TEAM_RE = /^[\p{L}\p{M}\d\s\-'·&.!]{1,60}$/u;

/** Achievement text — wider range but length-limited. */
const ACHIEVEMENT_MAX = 240;

/** Future date format: YYYY-MM-DD, year >= current year. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface SanitizeResult {
  safe: boolean;
  value: string;
  reason?: string;
}

/**
 * Sanitize a name/team string. Removes control characters and trims.
 * Returns { safe, value } — caller should reject if !safe.
 */
export function sanitizeName(raw: unknown, field: string): SanitizeResult {
  if (typeof raw !== "string") {
    return { safe: false, value: "", reason: `${field} must be a string` };
  }
  const trimmed = raw
    .replace(/[\x00-\x1f\x7f\u200B-\u200F\uFEFF]/g, "") // strip control chars & zero-width
    .trim();
  if (!trimmed) {
    return { safe: false, value: "", reason: `${field} is required` };
  }
  if (trimmed.length > 60) {
    return { safe: false, value: "", reason: `${field} is too long (max 60)` };
  }
  if (!NAME_RE.test(trimmed)) {
    return { safe: false, value: "", reason: `${field} contains invalid characters` };
  }
  return { safe: true, value: trimmed };
}

/**
 * Sanitize achievement text. Allows wider character set but enforces length.
 */
export function sanitizeAchievement(raw: unknown): SanitizeResult {
  if (typeof raw !== "string") {
    return { safe: false, value: "", reason: "achievement must be a string" };
  }
  const trimmed = raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200B-\u200F\uFEFF]/g, "")
    .trim();
  if (!trimmed) {
    return { safe: false, value: "", reason: "achievement is required" };
  }
  if (trimmed.length > ACHIEVEMENT_MAX) {
    return { safe: false, value: trimmed.slice(0, ACHIEVEMENT_MAX) };
  }
  return { safe: true, value: trimmed };
}

/**
 * Validate and sanitize a future-date string.
 */
export function sanitizeFutureDate(raw: unknown): SanitizeResult {
  if (typeof raw !== "string") {
    return { safe: false, value: "", reason: "futureDate must be a string" };
  }
  const trimmed = raw.trim();
  if (!DATE_RE.test(trimmed)) {
    return { safe: false, value: "", reason: "futureDate must be YYYY-MM-DD" };
  }
  const year = parseInt(trimmed.split("-")[0], 10);
  const currentYear = new Date().getFullYear();
  if (year < currentYear - 1 || year > 3000) {
    return { safe: false, value: "", reason: "futureDate year out of range" };
  }
  return { safe: true, value: trimmed };
}

/**
 * Validate that a URL is safe to fetch (prevents SSRF).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTP/HTTPS
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    // Block local/private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.startsWith("169.254.") ||  // link-local / cloud metadata
      hostname.startsWith("10.") ||       // private A
      hostname.startsWith("172.16.") ||   // private B
      hostname.startsWith("192.168.") ||  // private C
      hostname.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Simple in-memory rate limiter (per-request path).
 * For production, use Upstash Redis-based rate limiting instead.
 */
const rateMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/** Periodically clean up stale entries — call this once on module import. */
const CLEANUP_INTERVAL = 60_000; // 1 minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(key);
    }
  }, CLEANUP_INTERVAL);
}
