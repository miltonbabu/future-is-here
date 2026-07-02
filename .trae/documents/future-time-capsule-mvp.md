# Future Time Capsule — MVP Implementation Plan (Updated July 2026)

> **Hackathon context:** TRAE Friends Zhengzhou. Built and iterated beyond the original build window. Now a full-featured bilingual AI newspaper generator with persistence, sharing, and local network access.

**Goal:** A web app where a user types Name + Team + Achievement, uploads a photo, picks a future date, and gets a stunning vintage "Newspaper from the Future" front page — with AI-generated article, AI-generated illustration, QR code sharing, bilingual support (EN/ZH), and an archive of saved newspapers.

---

## Current State

- **Workspace:** `d:\TRAE FRINEDS PROJECT\FUTURE TIME CAPSULE`
- **Live deployment:** Vercel (`future-is-here.vercel.app`)
- **GitHub:** `github.com/miltonbabu/future-is-here`
- **Local network:** Self-hosted via `npm start -H 0.0.0.0` — accessible from phone on same WiFi

---

## Tech Stack

- Next.js 16.2.9 (App Router, Turbopack) + React 19.2 + TypeScript 5.5
- Tailwind CSS 3.4 + Google Fonts (Special Elite, Courier Prime, Libre Caslon Display, Lora, Noto Serif SC, ZCOOL KuHei)
- Zhipu GLM-4-Flash (article + achievements, server-side) + CogView-3-Plus (image, **client-side**)
- `qrcode.react` 4.2 for QR codes
- **Upstash Redis** (production) / File-based JSON (local dev) for server-side share storage
- `@upstash/redis` for persistent, cross-instance share token storage
- localStorage (client, max 20 capsules) + server-side share tokens
- Vercel deployment (auto-deploy from git) OR self-hosted (`npm start -H 0.0.0.0`)

---

## Phased Implementation (Completed)

### Phase 1: Foundation ✅
1. Scaffolded with `create-next-app` — TypeScript, Tailwind, App Router, Turbopack
2. Installed `qrcode.react`
3. Google Fonts loaded in `layout.tsx`
4. Tailwind config with custom fonts (newspaper + landing + Chinese) and colors
5. `lib/types.ts` — Language, ArticleData (7 keys), CapsuleInput (6 fields)
6. `lib/i18n.ts` — full EN/ZH translations, `formatDate()`, `t()`
7. `app/globals.css` — paper texture, polaroid frame (`#f4ead5` bg), drop cap, column rules
8. `package.json` scripts use `-H 0.0.0.0` for local network access

### Phase 2: Core AI Generation ✅
1. `app/api/generate-article/route.ts` — GLM-4-Flash (primary) → pre-built templates (fallback). Environment-aware timeout: 5s on Vercel, 30s self-hosted. No OpenAI (times out from China).
2. `app/api/generate-achievement/route.ts` — GLM generates 3 funny achievements by category + language. Falls back to pre-defined pool.
3. `app/api/generate-image/route.ts` — server-side image generation fallback (GLM CogView-3-Plus → CogView-3). Rarely used now — images primarily generated client-side (see #4 below). Returns `null` on failure (no SVG fallback).
4. `app/form/page.tsx` — **client-side image generation** via `generateImageClientSide()` — browser calls GLM CogView-3-Plus directly with 30s timeout, bypassing Vercel's 10s function limit. Uses `NEXT_PUBLIC_GLM_API_KEY`.
5. `components/CapsuleForm.tsx` — form with photo upload (camera + gallery), photo compression (400×500px JPEG @ 0.7), 4 achievement categories + roast pool, "Surprise Me" button (AI-powered), language toggle with sync
6. `handleGenerate()` flow: article API → client-side image → share token → localStorage + DB → show newspaper

### Phase 3: Polish & Share ✅
1. `app/api/share/route.ts` + `app/api/share/[token]/route.ts` — server-side share tokens (9-char), Next.js 16 async params (`Promise<{ token: string }>`). **Upstash Redis** for production storage (30-day TTL, auto-detected via env vars). File-based JSON fallback for local dev. **Image persistence:** POST downloads CogView illustration URL → converts to base64 before storing → shared newspapers never lose their illustration.
2. `app/share/[token]/page.tsx` — shared newspaper view, fetches from Redis/file
3. `components/Landing.tsx` — homepage with QR (→ /form, hydration-safe via useEffect), CTA
4. `components/Newspaper.tsx` — broadsheet layout, polaroid photo, AI illustration, QR (→ /share/token, ≤300 chars), copy link, download PNG
5. `app/api/capsules/route.ts` — CRUD for client-side archive sync (GET/POST/DELETE). Uses file-based JSON via `lib/db.ts`.
6. `lib/storage.ts` — localStorage CRUD (max 20) + DB sync, 3-tier quota fallback
7. `lib/db.ts` — file-based JSON using `fs` module (`/tmp/.data/` on Vercel)
8. Archive view ("My Newspapers") — floating button, grid of saved newspapers, delete option
9. Local network access — `-H 0.0.0.0` binding, phone accesses via `http://<PC-IP>:3000`

---

## Project Structure

```
future-time-capsule/
├── app/
│   ├── api/
│   │   ├── capsules/route.ts            # CRUD persistence (GET/POST/DELETE)
│   │   ├── generate-achievement/route.ts # AI achievement suggestions (GLM)
│   │   ├── generate-article/route.ts    # Article gen (GLM → fallback templates)
│   │   ├── generate-image/route.ts      # Server-side image fallback (rarely used)
│   │   └── share/
│   │       ├── route.ts                 # POST creates share token (Redis/file)
│   │       └── [token]/route.ts         # GET retrieves newspaper by token
│   ├── form/page.tsx                    # Form + client-side image gen + archive
│   ├── share/[token]/page.tsx           # Shared newspaper view
│   ├── globals.css                      # All styles, textures, fonts
│   ├── layout.tsx                       # Root layout, Google Fonts
│   └── page.tsx                         # Landing + shared newspaper hash router
├── components/
│   ├── CapsuleForm.tsx                  # Form, photo upload, AI Surprise Me
│   ├── Landing.tsx                      # Homepage, QR → /form, CTA
│   └── Newspaper.tsx                    # Newspaper render, QR → /share/token
├── lib/
│   ├── db.ts                            # File-based JSON DB (fs, /tmp on Vercel)
│   ├── i18n.ts                          # EN/ZH translations + date formatting
│   ├── storage.ts                       # localStorage CRUD (max 20) + DB sync
│   └── types.ts                         # TypeScript types
├── .env.example                         # API key placeholders
├── .env.local                           # Real API keys (gitignored)
├── HACKATHON-SPEECH.md                  # Presentation speech
├── MF.md                                # Master File (recreation guide)
├── package.json                         # dev: -H 0.0.0.0, start: -H 0.0.0.0
├── tailwind.config.ts                   # Theme (fonts, colors)
└── tsconfig.json
```

---

## Key Decisions (locked)

1. **Framework = Next.js 16 App Router.** Routes: `/` (landing + shared), `/form` (form + generation), `/share/<token>` (shared view).
2. **GLM first, no OpenAI for articles.** GLM is accessible in China; OpenAI times out. Removed OpenAI fallback entirely.
3. **Client-side image generation.** CogView takes 10-15s, exceeding Vercel's 10s limit. Browser fetches GLM directly (30s timeout) using `NEXT_PUBLIC_GLM_API_KEY`.
4. **No SVG fallback for images.** If image generation fails, newspaper shows without illustration — no empty slot.
5. **Server-side share tokens with Upstash Redis.** `/share/abc123xyz` URLs store full newspaper (article + images as base64) in Redis. 30-day TTL. Auto-falls back to file-based JSON in local dev.
6. **AI illustration persisted as base64.** When saving a share, the server downloads the CogView image URL and converts to base64. Shared newspapers never lose their illustration — CogView URLs expire, base64 data URLs don't.
7. **Photo compression.** 400×500px JPEG @ 0.7 (~50-100KB) via canvas. Prevents localStorage overflow.
8. **File-based JSON for local dev, Upstash Redis for production.** No native compilation. Redis auto-detected via env vars.
9. **Environment-aware timeouts.** 5s on Vercel (10s function limit), 30s self-hosted (no limit).
10. **Next.js 16 async params.** Route handler `params` are `Promise<{}>`, must be awaited.
11. **Hydration-safe QR codes.** Compute `window.location.origin` in `useEffect`, not during render.
12. **Separate font systems.** Landing: serif (Caslon/Lora). Newspaper: typewriter (Special Elite/Courier Prime).
13. **Local network access.** `-H 0.0.0.0` in both `dev` and `start` scripts.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GLM_API_KEY` | Yes | Zhipu GLM API key (server-side: article + achievements) |
| `NEXT_PUBLIC_GLM_API_KEY` | Yes | Same key, exposed to client for browser-side image generation |
| `OPENAI_API_KEY` | No | Optional, rarely used |
| `UPSTASH_REDIS_REST_URL` | Prod only | Upstash Redis REST URL — auto-set by Vercel. Falls back to file JSON without it. |
| `UPSTASH_REDIS_REST_TOKEN` | Prod only | Upstash Redis REST token — auto-set by Vercel. |

---

## API Endpoints

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/generate-article` | `{ name, team, achievement, futureDate, language, category }` | `{ article: ArticleData, provider }` |
| POST | `/api/generate-achievement` | `{ category, language }` | `{ achievements: string[] \| null }` |
| POST | `/api/share` | `SharedNewspaper` (imageUrl downloaded → base64) | `{ token: string }` — stored in Redis (prod) or file (dev) |
| GET | `/api/share/<token>` | — | `SharedNewspaper` — read from Redis (prod) or file (dev) |
| GET | `/api/capsules` | — | `DbCapsule[]` |
| POST | `/api/capsules` | `DbCapsule` | `{ success: true }` |
| DELETE | `/api/capsules` | `{ id }` | `{ success: true }` |

---

## Verification Checklist (final)

1. ✅ `npm run dev` boots with no errors; all Google Fonts load
2. ✅ Form validation: name + team + achievement + photo + date required
3. ✅ Photo upload: camera + gallery buttons work; photo shows sepia polaroid frame
4. ✅ Photo compressed to ~50-100KB (400×500px JPEG @ 0.7)
5. ✅ Article generation: GLM returns 7-key JSON; falls back to templates on failure
6. ✅ Image generation: CogView URL returned client-side; newspaper shows without illustration if fails
7. ✅ Newspaper renders all 7 fields + photo + illustration + QR + share link
8. ✅ QR code: homepage → /form, newspaper → /share/<token> (≤300 chars)
9. ✅ Copy Link: copies /share/<token> URL
10. ✅ Share link opens full newspaper with all images (article + photo + illustration)
11. ✅ Shared illustration persists (CogView URL downloaded → base64 on save)
12. ✅ Upstash Redis: shares persist across Vercel instances (production)
13. ✅ File fallback: shares work locally without Redis env vars
14. ✅ Language toggle: switches all UI + achievements + newspaper fonts
15. ✅ Archive: "My Newspapers" shows saved newspapers with thumbnails + delete
16. ✅ Local network: phone on same WiFi can access and generate (article + image)
17. ✅ No hydration warnings in console
18. ✅ Environment-aware timeouts (5s Vercel, 30s self-hosted)
19. ✅ Next.js 16 async params in route handlers

---

## Future Enhancements

- [ ] User accounts (auth)
- [ ] Download newspaper as PDF
- [ ] Social sharing (Twitter, WeChat)
- [ ] More achievement categories
- [ ] Custom newspaper names
- [ ] Multiple newspaper layouts
- [ ] Email capsule to future date
- [ ] Permanent server-side storage (database instead of /tmp JSON)

---

*This MVP plan reflects the actual implemented state of the Future Time Capsule app as of July 2026.*
