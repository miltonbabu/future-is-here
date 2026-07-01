# Future Time Capsule — MVP Implementation Plan (Updated)

> **Hackathon context:** TRAE Friends Zhengzhou. Built and iterated beyond the original 2.5h build window. Now a full-featured bilingual AI newspaper generator with persistence.

**Goal:** A web app where a user types Name + Team Name + Achievement, uploads a photo, picks a future date, and gets a stunning vintage "Newspaper from the Future" front page showing their wild future success — with AI-generated article, AI-generated illustration, QR code sharing, and bilingual support (EN/ZH).

**Current Architecture:** Next.js 16 App Router with separate landing page (`/`) and form page (`/form`). Three API routes handle article generation, image generation, and capsule persistence. AI provider chain: GLM (primary) → OpenAI (fallback) → pre-built templates/SVG (last resort). Photos stored as base64 data URLs. Newspapers persist in localStorage + server-side JSON file.

**Tech Stack:**
- Next.js 16.2.9 (App Router, Turbopack) + React 19.2 + TypeScript 5.5
- Tailwind CSS 3.4 + Google Fonts (Special Elite, Courier Prime, Libre Caslon Display, Lora, Noto Serif SC, ZCOOL KuHei)
- Zhipu GLM-4-Flash (article, primary) + CogView-3-Plus (image, primary)
- OpenAI gpt-4o-mini (article fallback) + DALL-E 2 (image fallback)
- `qrcode.react` 4.2 for QR codes
- File-based JSON storage (`.data/capsules.json`) + localStorage (client)
- Vercel deployment (auto-deploy from git)

---

## What Was Actually Built (Beyond Original MVP)

### Added vs Original Plan

| Feature | Original Plan | Actual Implementation |
|---|---|---|
| AI Image Generation | None (faces only via CSS) | GLM CogView-3-Plus → DALL-E 2 → SVG fallback |
| Bilingual | English only | EN + 中文 with full i18n, language-synced achievements |
| Landing Page | Single page toggle | Separate landing page with masthead, QR, CTA |
| Photo Upload | Single file input | Camera + Gallery buttons with `capture="environment"` |
| Achievement Suggestions | None | 4 categories (35+ items) + "Surprise me" + roast pool |
| Date Picker | Fixed 2032 | User-selectable future date with year-aware prompts |
| Persistence | None (fresh session) | localStorage + server JSON file, auto-restore on refresh |
| Share Links | QR encodes app URL | QR encodes full newspaper data as base64 URL hash |
| Fallback Chain | GLM only | GLM → OpenAI → pre-built templates (article) / SVG (image) |
| Newspaper Texture | CSS gradient | Real scanned paper texture from transparenttextures.com |
| Fonts | Playfair Display + Courier Prime | Special Elite + Courier Prime (newspaper), Libre Caslon + Lora (landing) |
| Photo Storage | `URL.createObjectURL()` | `FileReader.readAsDataURL()` (base64, survives re-renders) |

---

## Current State Analysis

- **Workspace:** Full production app at `d:\TRAE FRINEDS PROJECT\FUTURE TIME CAPSULE`
- **Live deployment:** Vercel (`future-is-here.vercel.app`)
- **GitHub:** `github.com/miltonbabu/future-is-here`
- **All features shipped** — see MVP Features checklist below

## Key Decisions (locked)

1. **Framework = Next.js 16 App Router.** Separate routes: `/` (landing + shared newspaper), `/form` (form + generation).
2. **GLM first, OpenAI second.** GLM is accessible in China; OpenAI often times out. Reversed from original plan.
3. **Face photo = local only.** `<input type="file">` → `FileReader.readAsDataURL()` → `<img>` with sepia filter. Never uploaded to server. Base64 data URL survives re-renders (blob URLs didn't).
4. **AI image generation = scene only.** No faces. GLM CogView-3-Plus generates photorealistic futuristic scenes. Falls back to DALL-E 2, then SVG.
5. **Sequential article→image.** Image prompt depends on article's `image_prompt` field, so they can't run in parallel.
6. **File-based JSON instead of SQLite.** No native compilation needed, works on Vercel serverless.
7. **URL hash encoding.** Newspaper data encoded as base64 in URL hash for shareable links without database lookup.
8. **Separate font systems.** Landing page uses serif (Libre Caslon + Lora); newspaper uses typewriter (Special Elite + Courier Prime).
9. **Real paper texture.** transparenttextures.com PNG overlay with multiply blend, not CSS gradients.
10. **Language sync.** Switching language re-rolls achievement chips AND auto-selects new achievement text in current language.

---

## Implemented Features — 6 Steps (Completed)

### Step 1: Scaffold project, dependencies, fonts & Tailwind ✅

**Files:** `package.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `.env.local`, `.env.example`, `.gitignore`, `eslint.config.mjs`

**What was done:**
1. Scaffolded with `create-next-app` — TypeScript, Tailwind, App Router, Turbopack
2. Installed `qrcode.react` 4.2
3. Google Fonts loaded in `layout.tsx`: Special Elite, Courier Prime, Libre Caslon Display, Libre Caslon Text, Lora, Noto Serif SC, Noto Sans SC, ZCOOL KuHei
4. Tailwind config with custom fonts (newspaper + landing + Chinese) and colors (paper `#f4ead5`, ink `#1c1612`, accent `#781e1e` via CSS variables)
5. `globals.css` with newspaper aesthetic: paper texture, polaroid frame, drop cap, column rules, press spinner
6. `.gitignore` includes `.env*.local`, `.trae/`, `.data/`

### Step 2: Landing page + form (input capture + live photo preview) ✅

**Files:** `app/page.tsx`, `app/form/page.tsx`, `components/Landing.tsx`, `components/CapsuleForm.tsx`, `lib/types.ts`, `lib/i18n.ts`

**What was done:**
1. `lib/types.ts` — `Language`, `ArticleData` (7 keys including `image_prompt`), `CapsuleInput` (6 fields including `category`)
2. `app/page.tsx` — Landing page + shared newspaper hash router (`#form` → form, `#<base64>` → shared newspaper)
3. `app/form/page.tsx` — Form page with generation flow, auto-restore from localStorage on mount
4. `components/Landing.tsx` — Masthead, lead story, QR code (encodes `/#form`), "Enter the Press" CTA
5. `components/CapsuleForm.tsx` — Name, team, date picker, achievement textarea, photo upload (camera + gallery), 4 achievement categories, "Surprise me" button, language toggle
6. `lib/i18n.ts` — Full EN/ZH translations, `formatDate()`, `t()` function

**Photo upload:** Two buttons — "Take Photo" (`capture="environment"`) and "Choose from Gallery". Uses `FileReader.readAsDataURL()` for base64 data URLs.

### Step 3: API route `/api/generate-article` (GLM → OpenAI → fallback) ✅

**Files:** `app/api/generate-article/route.ts`

**What was done:**
1. Provider chain: GLM-4-Flash (primary, 20s timeout) → OpenAI gpt-4o-mini (fallback, 20s) → pre-built templates (5 categories × 2 languages)
2. System prompt: witty future newspaper journalist, returns strict JSON with 7 keys (headline, paragraph1-3, future_quote, reward, image_prompt)
3. User prompt includes name, team, achievement, futureDate, year
4. `response_format: { type: "json_object" }` for both providers
5. 5 pre-built fallback templates: tech, ai, money, time, default — each with EN + ZH variants
6. Returns `{ article: ArticleData, provider: "glm" | "openai" | "fallback" }`

### Step 4: Newspaper result layout (headline, article, quote, polaroid photo) ✅

**Files:** `components/Newspaper.tsx`, `app/form/page.tsx`

**What was done:**
1. Full broadsheet layout: masthead (THE FUTURE TIMES / 未来时报), byline, headline with drop cap, 2-column justified body, pull quote, reward ribbon
2. Polaroid photo frame: `#f4ead5` background, 10px padding, 36px bottom, rotate -2deg, soft shadow, sepia filter
3. AI illustration (if available) with max-h-64 and caption
4. "Copy Link" button copies full URL with base64 hash
5. "Create Another" button resets to form
6. QR code with error correction `L` (max capacity), falls back to `/#form` if URL > 1500 chars

### Step 5: QR code + share bar ✅

**Files:** `components/Newspaper.tsx`, `components/Landing.tsx`

**What was done:**
1. Newspaper QR: encodes full newspaper URL with base64 hash (strips image data to keep under 1500 chars)
2. Landing QR: encodes `origin/#form` (bypasses landing page when scanned)
3. "Copy Link" button with "Copied!" state
4. Share section styled with newspaper aesthetic (double-rule border, paper bg)

### Step 6: Polish, error states, persistence, deploy ✅

**Files:** `lib/storage.ts`, `lib/db.ts`, `app/api/capsules/route.ts`, `app/globals.css`

**What was done:**
1. **Persistence:** localStorage (client) + file-based JSON (server at `.data/capsules.json`)
2. **Auto-restore:** On page load, fetches from DB → syncs to localStorage → restores last newspaper
3. **Loading state:** "PRINTING EDITION…" with ink-dot spinner
4. **Error state:** "Something glitched in the time machine. Try again."
5. **Responsive:** Form stacks on mobile; newspaper goes single-column; polaroid scales down
6. **Language sync:** Switching language re-rolls chips + achievement text
7. **Deployed to Vercel:** `future-is-here.vercel.app`

---

## Bonus Features (Added Beyond MVP)

### B1: AI Image Generation
- GLM CogView-3-Plus (primary, `quality: "hd"`, 1024x1024)
- OpenAI DALL-E 2 (fallback)
- SVG generator (5 vintage scenes, last resort)
- Prompt: photorealistic futuristic scene, no faces, sepia tones, photojournalism style

### B2: Bilingual Support (EN/ZH)
- Full i18n in `lib/i18n.ts` — all UI strings translated
- Language toggle button (EN ↔ 中文)
- Switching language updates: UI text, achievement chips, achievement input text, newspaper fonts
- Chinese fonts: Noto Serif SC, ZCOOL KuHei (headline), Noto Sans SC, PingFang SC (body)

### B3: Achievement Categories
- 4 categories: Tech & Coding (11 items), AI Mayhem (9), Money & Startups (8), Time & Chaos (7)
- "All" filter + roast pool (12 hackathon-flavored punchlines)
- "Surprise me" button — random achievement from selected category
- Each item has EN + ZH versions

### B4: Future Date Picker
- Native HTML date input
- Year-aware AI prompts (article set in user's chosen year)
- Year-shifted accent colors (near/mid/far eras)

### B5: Persistence & Auto-Restore
- `lib/storage.ts` — localStorage CRUD + DB sync
- `lib/db.ts` — file-based JSON using Node.js `fs` module
- `app/api/capsules/route.ts` — GET/POST/DELETE endpoints
- Auto-restore last newspaper on page load (from localStorage + DB)

### B6: Camera + Gallery Photo Upload
- "Take Photo" button with `capture="environment"` for mobile camera
- "Choose from Gallery" button for existing photos
- Photos stored as base64 data URLs (survives re-renders, no revocation needed)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GLM_API_KEY` | Yes | Zhipu GLM API key (article + image generation) |
| `OPENAI_API_KEY` | No | OpenAI API key (fallback for article + image) |

---

## API Endpoints

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/generate-article` | `{ name, team, achievement, futureDate, language, category }` | `{ article: ArticleData, provider: string }` |
| POST | `/api/generate-image` | `{ prompt: string }` | `{ src: "data:image/...", provider: string }` |
| GET | `/api/capsules` | — | `DbCapsule[]` |
| POST | `/api/capsules` | `DbCapsule` | `{ success: true }` |
| DELETE | `/api/capsules` | `{ id: string }` | `{ success: true }` |

---

## Verification Steps (final checklist)

1. ✅ `npm run dev` boots with no errors; all Google Fonts load
2. ✅ Form validation prevents submit until Name + Team + Achievement + photo + date are present
3. ✅ Uploaded photo renders instantly with sepia filter + polaroid frame
4. ✅ Camera + Gallery buttons work on mobile
5. ✅ `POST /api/generate-article` returns 7-key JSON; returns fallback on API failure
6. ✅ `POST /api/generate-image` returns base64 image; falls back to SVG
7. ✅ Newspaper renders all 7 fields + photo + AI illustration + pulled quote + reward
8. ✅ QR code renders, scans to shared newspaper URL; "Copy Link" works
9. ✅ Language toggle switches all UI + achievements + newspaper fonts
10. ✅ Switching language re-rolls achievement chips AND input text
11. ✅ Refresh restores last newspaper from localStorage/DB
12. ✅ Live Vercel deploy passes the full flow on mobile + desktop
13. ✅ Fallback chain: GLM → OpenAI → templates (article) / SVG (image)
14. ✅ Landing page QR encodes `/#form` (bypasses landing)
15. ✅ Newspaper QR encodes full newspaper data as base64 hash

---

## Future Enhancements

- [ ] User accounts (auth)
- [ ] Gallery of all created newspapers
- [ ] Download newspaper as PDF
- [ ] Social sharing (Twitter, WeChat, etc.)
- [ ] More achievement categories
- [ ] Custom newspaper names
- [ ] Multiple newspaper layouts
- [ ] Email capsule to future date

---

*This MVP plan reflects the actual implemented state of the Future Time Capsule app as of July 2026.*
