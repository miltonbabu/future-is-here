# Security Audit Report — Future Time Capsule

**Date:** 2026-07-03  
**Scope:** Full codebase audit  
**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Summary of Findings

| # | Vulnerability | Severity | Status |
|---|---|---|---|
| 1 | Client-side API Key Exposure | 🔴 Critical | ✅ Fixed |
| 2 | Missing Input Validation (capsules API) | 🟠 High | ✅ Fixed |
| 3 | SSRF via Image Download (share API) | 🟠 High | ✅ Fixed |
| 4 | Unrestricted Body Acceptance (share API) | 🟠 High | ✅ Fixed |
| 5 | Token Injection (share/[token] API) | 🟡 Medium | ✅ Fixed |
| 6 | Missing Rate Limiting (multiple routes) | 🟡 Medium | ✅ Fixed |
| 7 | Missing Input Validation (generate-article API) | 🟡 Medium | ✅ Fixed |
| 8 | Error Message Leakage | 🟢 Low | ✅ Fixed |
| 9 | Missing Security Headers | 🟡 Medium | ✅ Fixed |

---

## Detailed Findings & Fixes

### 1. 🔴 Critical: Client-side API Key Exposure

**File:** `app/form/page.tsx`  
**Issue:** The `generateImageClientSide()` function called the GLM (CogView) API **directly from the browser** using `NEXT_PUBLIC_GLM_API_KEY`. This meant any visitor could inspect the page source or network tab to steal the API key and abuse it.

**Risk:** API key theft → unauthorized usage → billing abuse, account compromise.

**Fix:** Replaced `generateImageClientSide()` with `generateImageServerSide()` which calls the existing `/api/generate-image` server route. The API key now stays on the server where it belongs.

```diff
- async function generateImageClientSide(prompt: string): Promise<string | null> {
-   const glmKey = process.env.NEXT_PUBLIC_GLM_API_KEY;  // EXPOSED!
-   const res = await fetch("https://open.bigmodel.cn/...", {
-     headers: { Authorization: `Bearer ${glmKey}` },
-   });
- }

+ async function generateImageServerSide(prompt: string): Promise<string | null> {
+   const res = await fetch("/api/generate-image", {
+     method: "POST",
+     body: JSON.stringify({ prompt }),
+   });
+ }
```

---

### 2. 🟠 High: Missing Input Validation (Capsules API)

**File:** `app/api/capsules/route.ts`  
**Issue:** The POST handler accepted any JSON body and saved it directly to the database without validation. The DELETE handler only checked if `id` existed, but didn't validate its format.

**Risk:** Arbitrary data injection, oversized payloads stored, potential for crafted IDs to cause issues in downstream lookups.

**Fix:**
- Added `sanitizeName()`-style validation for all fields (name, team, etc.)
- Added regex-based ID format validation (`/^[\w-]{1,64}$/`)
- All string fields are truncated to safe lengths
- Photo URL capped at 500KB in base64
- Article content capped at 10KB

---

### 3. 🟠 High: SSRF via Image Download

**File:** `app/api/share/route.ts`  
**Issue:** `persistImageAsBase64()` fetched any URL from user input without validating the destination. An attacker could supply `http://169.254.169.254/latest/meta-data/` (AWS metadata), `http://localhost:6379/` (Redis), or internal network addresses.

**Risk:** Server-Side Request Forgery (SSRF) — access to internal services, cloud metadata exfiltration.

**Fix:** Added `isSafeUrl()` check (from `lib/security.ts`) before any fetch:
- Blocks private IPs (10.x, 172.16.x, 192.168.x, 169.254.x, [::1], localhost)
- Blocks non-HTTP(S) protocols
- Blocks `.local` domains
- Added image download size cap (`MAX_IMAGE_BYTES = 1MB`)

---

### 4. 🟠 High: Unrestricted Body Acceptance

**File:** `app/api/share/route.ts`  
**Issue:** The POST handler accepted any JSON and stored it directly. Article content, user names, and image URLs had no size limits or sanitization.

**Risk:** Storage exhaustion (very large payloads), XSS via stored article content, database poisoning.

**Fix:** Added `validateSharedInput()` function with:
- All article fields sanitized (script/style tags stripped, capped at 500 chars)
- Name/team truncated to 60 chars
- Image URLs capped at 500KB
- Date format validated
- Max 500 share entries in file-based storage

---

### 5. 🟡 Medium: Token Injection

**File:** `app/api/share/[token]/route.ts`  
**Issue:** The `token` from the URL params was used directly in Redis keys and file lookups without format validation. Malformed tokens could cause unexpected behavior.

**Risk:** Potential for path traversal (file fallback), Redis key pollution.

**Fix:** Added `TOKEN_RE` (`/^[a-z0-9]{9}$/`) — tokens from `Math.random().toString(36)` are always 9 lowercase alphanumeric characters. Rejects anything else with 400.

---

### 6. 🟡 Medium: Missing Rate Limiting

**Files:** `app/api/capsules/route.ts`, `app/api/share/route.ts`, `app/api/share/[token]/route.ts`  
**Issue:** These routes had no rate limiting, allowing unlimited requests. Attackers could brute-force tokens, spam share creation, or exhaust storage.

**Fix:** Added `checkRateLimit()` (from `lib/security.ts`) to all three routes with appropriate limits:
- `capsules GET`: 30 req/min/IP
- `capsules POST`: 15 req/min/IP
- `capsules DELETE`: 10 req/min/IP
- `share POST`: 20 req/min/IP
- `share GET (health)`: 10 req/min/IP
- `share/[token] GET`: 30 req/min/IP

---

### 7. 🟡 Medium: Input Validation (Article Generation)

**Files:** `app/api/generate-article/route.ts`, `app/api/generate-achievement/route.ts`  
**Issue:** These routes accepted and forwarded user input to AI APIs.

**Fix:** Added comprehensive validation using shared `lib/security.ts` utilities:
- `sanitizeName()` for name/team (strips control chars, enforces character set, max 60 chars)
- `sanitizeAchievement()` for achievement text (strips control chars, max 240 chars)
- `sanitizeFutureDate()` for date validation (YYYY-MM-DD, year range check)
- Rate limiting applied (15 req/min for article, 10 req/min for achievement)

---

### 8. 🟢 Low: Error Message Leakage

**Files:** Multiple API routes  
**Issue:** Error responses included raw stack traces and internal details.

**Fix:** All API routes now return sanitized, generic error messages. Internal details are logged server-side via `console.error()` but never returned to clients.

---

### 9. 🟡 Medium: Missing Security Headers

**File:** `next.config.mjs`  
**Issue:** No Content Security Policy, no frame protection, no permission policy.

**Fix:** Added comprehensive security headers:
- `Content-Security-Policy`: Restricts script/style sources, blocks inline execution in production
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy`: Restricts camera, microphone, geolocation

---

## New Security Infrastructure

**`lib/security.ts`** — Centralized security utilities:
- `sanitizeName()` — Name/team validation (Unicode-aware, control char removal)
- `sanitizeAchievement()` — Achievement text sanitization
- `sanitizeFutureDate()` — Date format/range validation
- `isSafeUrl()` — URL validation (prevents SSRF)
- `checkRateLimit()` — In-memory rate limiter with periodic cleanup

---

## Recommendations for Production

1. **Redis-based rate limiting**: Replace in-memory `checkRateLimit()` with Upstash Redis (`@upstash/ratelimit`) for distributed consistency.
2. **Authentication**: Consider adding simple token-based auth for the capsules API (at minimum, require the capsule's own ID for DELETE operations).
3. **CSP in production**: Remove `'unsafe-inline'` and `'unsafe-eval'` from the Content Security Policy once the app is stable.
4. **Environment variable audit**: Ensure `NEXT_PUBLIC_*` variables only contain truly public-safe data.
5. **Dependency scanning**: Add `npm audit` to CI/CD pipeline.
6. **HTTPS enforcement**: Ensure Vercel/Netlify automatically redirects HTTP to HTTPS.
