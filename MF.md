# MASTER FILE (MF) — Future Time Capsule

> **Purpose**: This file contains every prompt, design decision, file structure, and step needed to recreate this app from scratch. Feed this to any AI agent along with the project folder, and it will produce the same app.

---

## 1. WHAT WE BUILT

**Future Time Capsule** — a web app where users type their name, team, and a future achievement, and AI generates a full vintage newspaper front page from that future year, complete with:
- AI-written newspaper article (headline + 3 paragraphs + quote + reward)
- AI-generated photorealistic illustration (no faces, futuristic scene) — generated **client-side** to bypass Vercel's 10s function limit
- User's uploaded photo in a polaroid frame with sepia filter (compressed to ~50KB base64)
- AI-generated funny achievement suggestions ("Surprise me" button) — category-aware, language-aware
- QR code for sharing — homepage QR points to form, newspaper QR points to shareable URL with all images
- Server-side share tokens (`/share/abc123xyz`) — short URLs that include all images + text
- Bilingual support (English + Chinese) with language-synced achievements
- Classic broadsheet newspaper aesthetic with real paper texture
- localStorage + server-side JSON persistence with auto-restore on refresh

Built at the **TRAE Friends Zhengzhou hackathon**.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Frontend | React 19.2, TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| AI Article | Zhipu GLM-4-Flash (primary, server-side), pre-built templates (fallback) |
| AI Image | Zhipu CogView-3-Plus (primary, **client-side**), no SVG fallback |
| AI Achievements | Zhipu GLM-4-Flash (category + language aware) |
| QR Codes | qrcode.react 4.2 |
| Storage (client) | localStorage (max 5 capsules, compressed photos) |
| Storage (server) | File-based JSON (`.data/capsules.json` + `.data/shares.json`) |
| Share Links | Server-side tokens (`/share/<9char>`) with full image data |
| Deployment | Vercel (Hobby plan, 10s function limit) |

---

## 3. ALL PROMPTS USED

### 3.1 Article Generation — System Prompt
```
You are a witty future newspaper journalist. {languageInstruction}Write an inspirational, fun front-page article about this person's extraordinary rise to success. Return ONLY a valid JSON object, no markdown, no code fences, with these exact keys: headline, paragraph1, paragraph2, paragraph3, future_quote, reward, image_prompt. Each paragraph is 1-2 sentences. future_quote is a first-person quote from the person. reward is a short fun line about their lavish reward. The headline must include the team name. image_prompt is a short description (one sentence) of a fitting vintage illustration scene related to the story — NO people, NO faces, only scenes, objects, cityscapes, or abstract concepts. Always write image_prompt in English regardless of the article language.
```

**Language instruction variants:**
- English: `"Write the article in English. "`
- Chinese: `"Write the entire article in Chinese (中文). "`

### 3.2 Article Generation — User Prompt
```
Name: {name}. Team: {team}. Achievement they're known for: {achievement}. The newspaper is dated {futureDate} (year {year}). Write their {year} success story as a front-page newspaper article set in {year}.
```

### 3.3 Image Generation — Illustration Prompt (Client-Side)
```
{article.image_prompt}, photorealistic, vintage newspaper photo, sepia tones, warm lighting, no people no faces
```
**Note:** Prompt kept short (~100 chars) because CogView-3-Plus rejects prompts over ~200 chars.

### 3.4 AI Article Expected JSON Shape
```json
{
  "headline": "string (must include team name)",
  "paragraph1": "string (1-2 sentences)",
  "paragraph2": "string (1-2 sentences)",
  "paragraph3": "string (1-2 sentences)",
  "future_quote": "string (first-person quote)",
  "reward": "string (fun lavish reward line)",
  "image_prompt": "string (English, scene description, no people/faces)"
}
```

### 3.5 Achievement Generation — System Prompt
```
{languageInstruction}You are a witty hackathon participant coming up with absurd, funny future achievements. Generate 3 short, humorous achievement ideas based on the given category. Each achievement should be 1-2 sentences, funny, tech-themed, and about extraordinary future success. Return ONLY a valid JSON array of strings, no markdown, no code fences.
```

### 3.6 Achievement Generation — User Prompt
```
Generate 3 funny future achievements for the category: {categoryName}. Make them absurd, tech-focused, and humorous.
```

**Category names by language:**
| Category ID | English | Chinese |
|---|---|---|
| tech | Tech & Coding | 科技与编程 |
| ai | AI Mayhem | AI疯狂 |
| money | Money & Startups | 金钱与创业 |
| time | Time & Chaos | 时间与混乱 |
| all | General Tech/Hackathon | 综合科技/黑客马拉松 |

### 3.7 Achievement Generation — Expected Response
```json
{
  "achievements": [
    "Invented a compiler that writes haikus about the code it compiles",
    "Fixed a bug so old it had its own pension plan",
    "Built an IDE that argues with you about code style"
  ]
}
```

---

## 4. DESIGN SYSTEM

### 4.1 Colors (CSS Variables)
| Variable | RGB | Hex | Usage |
|---|---|---|---|
| `--paper` | 244 234 213 | `#f4ead5` | Aged newsprint background |
| `--ink` | 28 22 18 | `#1c1612` | Deep brown-black text |
| `--accent` | 120 30 30 | `#781e1e` | Deep red seal (masthead, rules) |

### 4.2 Year-Shifted Accents
| Era | Paper | Ink | Accent |
|---|---|---|---|
| Near (2025-2030) | `#f4ead5` | `#1c1612` | Deep red `#781e1e` |
| Mid (2031-2040) | `#f0e8da` | `#161a32` | Ink blue `#1c2660` |
| Far (2041+) | `#f6ecd6` | `#281e14` | Aged gold `#98601a` |

### 4.3 Fonts

**Newspaper (English):**
- Headlines: `Special Elite` (distressed typewriter)
- Body: `Courier Prime` (typewriter)
- Labels: `Courier Prime` bold uppercase

**Landing Page (English):**
- Headlines: `Libre Caslon Display` (classic broadsheet serif)
- Body: `Lora` (readable serif)
- Labels: `Libre Caslon Text` small-caps

**Chinese:**
- Headlines: `Noto Serif SC`, `ZCOOL KuHei`
- Body: `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`

**Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Special+Elite&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Noto+Serif+SC:wght@400;500;700;900&family=Noto+Sans+SC:wght@400;500;700&family=ZCOOL+KuHei&display=swap
```

### 4.4 Newspaper Aesthetic
- Background: `#f4ead5` base + `transparenttextures.com/patterns/cream-paper.png` overlay with `multiply` blend mode
- Paper grain: dot gradient pattern (4px + 7px layers)
- Ink color: `#1c1612` (brown-black, not pure black)
- Vertical column rule between text columns
- Justified text with hyphenation
- Drop cap on first paragraph (4.2rem, accent color)
- Double-rule masthead border (3px double)
- Polaroid photo frame: 10px padding, 36px bottom, rotate -2deg, soft shadow, `#f4ead5` background (matches newspaper, not white)

### 4.5 Photo Filter (Uploaded User Photo)
```css
filter: sepia(50%) saturate(140%) contrast(100%) brightness(108%) hue-rotate(-8deg);
```

### 4.6 AI Illustration
- Max height: `max-h-64` (256px) with `object-cover`
- Only shown if generation succeeds (no empty slots, no SVG fallback)
- Generated **client-side** via browser fetch to GLM (bypasses Vercel 10s limit)
- 30-second browser timeout (CogView takes 10-15s)

---

## 5. PROJECT STRUCTURE

```
future-time-capsule/
├── app/
│   ├── api/
│   │   ├── capsules/
│   │   │   └── route.ts              # CRUD API for persistence (GET/POST/DELETE)
│   │   ├── generate-achievement/
│   │   │   └── route.ts              # AI achievement suggestions (GLM, category + language aware)
│   │   ├── generate-article/
│   │   │   └── route.ts              # Article generation (GLM → pre-built fallback templates)
│   │   ├── generate-image/
│   │   │   └── route.ts              # Image generation API (server-side fallback, rarely used)
│   │   └── share/
│   │       └── route.ts              # Share token CRUD — POST creates token, GET retrieves newspaper
│   ├── form/
│   │   └── page.tsx                  # Form page — input, photo upload, client-side image gen, share flow
│   ├── share/
│   │   └── [token]/
│   │       └── page.tsx              # Shared newspaper view — fetches by token, shows all images
│   ├── globals.css                   # All newspaper styles, textures, fonts, animations
│   ├── layout.tsx                    # Root layout, Google Fonts, metadata
│   └── page.tsx                      # Landing page + shared newspaper hash router
├── components/
│   ├── CapsuleForm.tsx               # Name/team/achievement form, photo upload, AI "Surprise me", language toggle
│   ├── Landing.tsx                   # Homepage — masthead, lead story, QR code (→ /form), CTA
│   └── Newspaper.tsx                 # Generated newspaper rendering, QR code (→ /share/token), share link
├── lib/
│   ├── db.ts                         # File-based JSON database (fs module, /tmp on Vercel)
│   ├── i18n.ts                       # EN/ZH translations + date formatting
│   ├── storage.ts                    # localStorage CRUD (max 5 capsules) + DB sync
│   └── types.ts                      # TypeScript types (Language, ArticleData, CapsuleInput)
├── .env.example                      # API key placeholders (includes NEXT_PUBLIC_GLM_API_KEY)
├── .env.local                        # Real API keys (gitignored)
├── .gitignore                        # Node, Next.js, .env, .trae, .data
├── eslint.config.mjs                 # ESLint 9 flat config
├── next.config.mjs                   # Next.js config
├── package.json                      # Dependencies
├── postcss.config.mjs                # PostCSS for Tailwind
├── tailwind.config.ts                # Tailwind theme (fonts, colors)
└── tsconfig.json                     # TypeScript config
```

---

## 6. FILE-BY-FILE SPECIFICATIONS

### 6.1 `lib/types.ts`
```typescript
export type Language = "en" | "zh";

export interface ArticleData {
  headline: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  future_quote: string;
  reward: string;
  image_prompt: string;
}

export interface CapsuleInput {
  name: string;
  team: string;
  achievement: string;
  futureDate: string;       // ISO date "2032-07-01"
  language: Language;
  category: string;          // "tech" | "ai" | "money" | "time" | "default" | "all"
}
```

### 6.2 `lib/i18n.ts`
- Translation keys for all UI strings (form labels, buttons, newspaper meta)
- `formatDate(iso, lang)` → `{ long, year }` — formats dates as "July 1, 2032" or "2032年7月1日"
- `t(lang, key)` — returns translated string

### 6.3 `lib/storage.ts`
- `SavedCapsule` interface with `id`, `createdAt`, article, images, metadata
- `saveCapsule()` — saves to localStorage (max 5, compressed) + POSTs to `/api/capsules`
- `getAllCapsules()` — reads from localStorage
- `loadCapsulesFromDb()` — fetches from `/api/capsules` and syncs to localStorage
- `deleteCapsule()` — removes from localStorage + DELETEs from API
- 3-tier fallback for localStorage quota: full → without images → current only

### 6.4 `lib/db.ts`
- File-based JSON storage at `.data/capsules.json` (local) or `/tmp/.data/capsules.json` (Vercel)
- Uses Node.js `fs` module (synchronous read/write)
- All operations wrapped in try/catch — never throws (Vercel read-only filesystem safe)
- Functions: `saveCapsuleToDb()`, `getCapsuleFromDb()`, `getAllCapsulesFromDb()`, `deleteCapsuleFromDb()`

### 6.5 `app/api/generate-article/route.ts`
- **Provider chain**: GLM-4-Flash (primary, 5s timeout) → pre-built templates (instant fallback)
- **No OpenAI fallback** — removed because it always times out from China and wastes time
- `maxDuration = 10` (Vercel Hobby compatible)
- Returns JSON: `{ article: ArticleData, provider: "glm" | "fallback" }`
- 5 pre-built template categories: tech, ai, money, time, default (each with EN + ZH variants)
- Templates include headline, 3 paragraphs, quote, reward, and image prompt functions

### 6.6 `app/api/generate-image/route.ts` (Server-side fallback only)
- **Rarely used** — image generation primarily happens client-side in `app/form/page.tsx`
- Server-side fallback: GLM CogView-3-Plus → returns error (no SVG)
- `maxDuration = 10` (Vercel Hobby compatible)
- If both fail, returns `{ src: null }` — newspaper shows without illustration

### 6.7 `app/api/generate-achievement/route.ts` (NEW)
- Uses GLM-4-Flash to generate 3 funny achievements based on category + language
- `maxDuration = 10`
- System prompt: witty hackathon participant, returns JSON array of 3 strings
- If GLM fails, returns `{ achievements: null }` — client falls back to pre-defined pool
- `temperature: 1.0` for maximum creativity

### 6.8 `app/api/share/route.ts` (NEW)
- `POST` — saves full newspaper data (article + imageUrl + photoUrl + metadata) to `.data/shares.json`, returns 9-char token
- `GET /api/share/<token>` — retrieves full newspaper data by token
- Token format: 9 random alphanumeric chars (e.g., `abc123xyz`)
- Share URL: `https://domain.com/share/abc123xyz` — short enough for QR codes

### 6.9 `app/api/capsules/route.ts`
- `GET` — returns all capsules from JSON file
- `POST` — saves a capsule (insert or update by ID)
- `DELETE` — deletes by ID

### 6.10 `app/page.tsx` (Landing + Shared Newspaper)
- Reads URL hash: `#form` → redirects to `/form`
- Reads URL hash: `#<base64>` → decodes shared newspaper and displays it
- No hash → shows `Landing` component

### 6.11 `app/form/page.tsx` (Form + Generation Flow + Client-Side Image Gen)
- **Client-side image generation**: `generateImageClientSide()` calls GLM CogView-3-Plus directly from browser with 30s timeout (bypasses Vercel's 10s function limit)
- Uses `NEXT_PUBLIC_GLM_API_KEY` (exposed to client)
- `useEffect` on mount: checks URL hash → checks `/share/<token>` path → loads from localStorage/DB
- `handleGenerate()`:
  1. POST `/api/generate-article` with CapsuleInput
  2. Call GLM CogView-3-Plus **directly from browser** for image (30s timeout)
  3. Upload full newspaper (with images) to `/api/share` → get share token
  4. Share URL becomes `/share/<token>` (short, QR-friendly)
  5. Save to localStorage + DB
  6. Show Newspaper component
- If image generation fails: newspaper shows without illustration (no SVG, no empty slot)
- If share upload fails: falls back to base64 URL hash

### 6.12 `app/share/[token]/page.tsx` (NEW)
- Dynamic route for shared newspapers
- Fetches newspaper data from `/api/share/<token>`
- Shows full Newspaper component with all images
- "Create Another" button redirects to `/form`

### 6.13 `components/CapsuleForm.tsx`
- Form fields: name, team, future date (native date picker), achievement (textarea)
- Photo upload: two buttons — "Take Photo" (`capture="environment"`) and "Choose from Gallery"
- Photo compressed to 400×500px JPEG @ 0.7 quality (~50-100KB) via canvas before storing as base64
- Achievement suggestions: 4 categories (tech, ai, money, time) + "All" filter
- **"Surprise me" button** — calls `/api/generate-achievement` API for AI-generated achievements:
  - Sends current category + language
  - If AI succeeds: sets achievement to first item, chips to all 3 items
  - If AI fails: falls back to pre-defined pool (random selection)
- Language toggle button (EN ↔ 中文)
- `useEffect` on language change: re-rolls chips AND auto-selects new achievement in current language

### 6.14 `components/Landing.tsx`
- Layout: top bar → masthead → lead story → QR + CTA → footer
- **QR code always encodes `origin/form`** — scanning takes user to form to create new newspaper
- CTA button navigates to `/form`
- Uses landing-specific fonts (Libre Caslon + Lora), NOT newspaper fonts

### 6.15 `components/Newspaper.tsx`
- Full broadsheet layout: masthead, byline, headline, drop-cap article, pull quote, reward
- Uploaded photo in polaroid frame with sepia filter (frame color: `#f4ead5`, not white)
- AI illustration (if available) with caption, max-h-64
- **QR code encodes share URL** (`/share/<token>`) — anyone scanning sees full newspaper with images
- "Copy Link" button copies share URL
- "Create Another" button resets to form
- QR error correction: `L` (max capacity)

### 6.16 `app/globals.css`
- CSS variables for paper/ink/accent colors
- Year-shifted accent variables (near/mid/far)
- Font classes: `.h-headline`, `.h-body`, `.h-label` (newspaper), `.landing-headline`, `.landing-body`, `.landing-label` (landing)
- `.newspaper-paper` — real paper texture from transparenttextures.com
- `.polaroid-frame` — `#f4ead5` border, thick bottom, rotate -2deg, shadow
- `.paper-grain` — dot gradient texture
- `.press-body` — justified text with hyphenation
- `.drop-cap` — large initial letter (4.2rem, accent color)
- `.press-spinner` — loading animation

### 6.17 `tailwind.config.ts`
- Custom font families for newspaper (Special Elite, Courier Prime) and landing (Libre Caslon, Lora)
- Chinese font stacks for headline and body
- Custom colors: `paper`, `ink`, `accent`, `accent-soft` (via CSS variables)

---

## 7. ACHIEVEMENT CATEGORIES

### 7.1 Categories (with EN + ZH items)

| ID | EN Label | ZH Label | Items |
|---|---|---|---|
| `tech` | Tech & Coding | 科技与编程 | 11 items |
| `ai` | AI Mayhem | AI疯狂 | 9 items |
| `money` | Money & Startups | 金钱与创业 | 8 items |
| `time` | Time & Chaos | 时间与混乱 | 7 items |

### 7.2 Roast Pool (used when "All" selected)
- 12 EN items + 12 ZH items (hackathon-flavored punchlines)

### 7.3 AI "Surprise Me"
- Calls `/api/generate-achievement` with category + language
- GLM-4-Flash generates 3 new funny achievements
- Falls back to pre-defined pool if AI fails

---

## 8. ENVIRONMENT VARIABLES

| Variable | Required | Description |
|---|---|---|
| `GLM_API_KEY` | Yes | Zhipu GLM API key (server-side: article + achievement generation) |
| `NEXT_PUBLIC_GLM_API_KEY` | Yes | Same GLM key, exposed to client for browser-side image generation |
| `OPENAI_API_KEY` | No | OpenAI API key (optional fallback, rarely used) |

**Vercel setup:** Add both `GLM_API_KEY` and `NEXT_PUBLIC_GLM_API_KEY` with the same value in Vercel → Settings → Environment Variables → Production.

---

## 9. STEP-BY-STEP RECREATION GUIDE

### Step 1: Initialize Project
```bash
npx create-next-app@latest future-time-capsule --typescript --tailwind --app --turbopack
cd future-time-capsule
npm install qrcode.react
```

### Step 2: Configure Tailwind
- Add custom font families (newspaper + landing + Chinese)
- Add custom colors (paper, ink, accent via CSS variables)

### Step 3: Add Google Fonts
- In `layout.tsx`, add Google Fonts link: Special Elite, Courier Prime, Libre Caslon Display, Libre Caslon Text, Lora, Noto Serif SC, Noto Sans SC, ZCOOL KuHei

### Step 4: Create Types
- `lib/types.ts` — Language, ArticleData, CapsuleInput

### Step 5: Create i18n
- `lib/i18n.ts` — all UI strings in EN + ZH, formatDate(), t()

### Step 6: Create Storage
- `lib/storage.ts` — localStorage CRUD (max 5, compressed) + DB sync via fetch
- `lib/db.ts` — file-based JSON storage using fs (uses `/tmp` on Vercel)

### Step 7: Create API Routes
- `app/api/generate-article/route.ts` — GLM (5s timeout) → pre-built fallback templates
- `app/api/generate-achievement/route.ts` — GLM generates 3 funny achievements by category + language
- `app/api/generate-image/route.ts` — server-side fallback (rarely used, client-side is primary)
- `app/api/capsules/route.ts` — CRUD for persistence
- `app/api/share/route.ts` — share token CRUD (POST creates, GET retrieves)

### Step 8: Create Components
- `components/Landing.tsx` — masthead, lead story, QR (→ /form), CTA
- `components/CapsuleForm.tsx` — form with photo upload, AI "Surprise me", language toggle
- `components/Newspaper.tsx` — full newspaper render with QR (→ /share/token) and share link

### Step 9: Create Pages
- `app/page.tsx` — landing + shared newspaper hash router
- `app/form/page.tsx` — form page with **client-side image generation** (30s timeout, bypasses Vercel limit)
- `app/share/[token]/page.tsx` — shared newspaper view (fetches by token)

### Step 10: Add Styles
- `app/globals.css` — all newspaper textures, fonts, animations, polaroid frame (frame color: `#f4ead5`)

### Step 11: Configure Environment
- `.env.local` — add `GLM_API_KEY`, `NEXT_PUBLIC_GLM_API_KEY` (same value), `OPENAI_API_KEY` (optional)
- `.env.example` — placeholder template
- `.gitignore` — add `.env*.local`, `.trae/`, `.data/`

### Step 12: Test & Deploy
```bash
npm run dev          # local testing
npm run build        # production build
git push             # push to GitHub
# Import on Vercel → add env vars (GLM_API_KEY + NEXT_PUBLIC_GLM_API_KEY) → deploy
```

---

## 10. API ENDPOINTS

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/generate-article` | `{ name, team, achievement, futureDate, language, category }` | `{ article: ArticleData, provider: string }` |
| POST | `/api/generate-achievement` | `{ category, language }` | `{ achievements: string[] \| null }` |
| POST | `/api/generate-image` | `{ prompt: string }` | `{ src: string \| null, provider: string }` |
| POST | `/api/share` | `SharedNewspaper` | `{ token: string }` |
| GET | `/api/share/<token>` | — | `SharedNewspaper` |
| GET | `/api/capsules` | — | `DbCapsule[]` |
| POST | `/api/capsules` | `DbCapsule` | `{ success: true }` |
| DELETE | `/api/capsules` | `{ id: string }` | `{ success: true }` |

---

## 11. KEY DESIGN DECISIONS

1. **GLM first, no OpenAI for articles** — OpenAI always times out from China, wastes 8s. GLM only (5s timeout) → instant fallback templates if fails.
2. **Client-side image generation** — CogView takes 10-15s, exceeding Vercel's 10s function limit. Browser fetch has no timeout limit (30s set). Uses `NEXT_PUBLIC_GLM_API_KEY`.
3. **No SVG fallback** — if image generation fails, newspaper shows without illustration (no empty slot, no SVG).
4. **Server-side share tokens** — `/share/abc123xyz` URLs include all images + text. Short enough for QR codes. Anyone can view.
5. **Homepage QR → /form** — scanning homepage QR takes user to form to create new newspaper (not a shared one).
6. **Newspaper QR → /share/<token>** — scanning newspaper QR shows the full newspaper with all images.
7. **Photo compression** — 400×500px JPEG @ 0.7 quality (~50-100KB) via canvas. Prevents localStorage quota overflow.
8. **File-based JSON instead of SQLite** — no native compilation, works on Vercel serverless. Uses `/tmp` in production.
9. **AI "Surprise me"** — generates category-aware, language-aware funny achievements via GLM-4-Flash. Falls back to pre-defined pool.
10. **Separate font systems** — landing page uses serif (Caslon/Lora), newspaper uses typewriter (Special Elite/Courier Prime).
11. **Polaroid frame color** — `#f4ead5` (matches newspaper paper), not white.
12. **maxDuration = 10** — all API routes set to 10s (Vercel Hobby plan compatible).

---

## 12. MVP FEATURES

- [x] Landing page with QR code (→ /form) and CTA
- [x] Form with name, team, achievement, photo upload (camera + gallery), date picker
- [x] AI article generation (GLM-4-Flash, 5s timeout, pre-built fallback)
- [x] AI image generation (CogView-3-Plus, **client-side**, 30s timeout)
- [x] AI achievement suggestions ("Surprise me" — category + language aware)
- [x] Newspaper rendering with vintage broadsheet aesthetic
- [x] Polaroid photo frame with sepia filter (frame matches paper color)
- [x] QR code for sharing (homepage → /form, newspaper → /share/<token>)
- [x] Copy link button (copies /share/<token> URL)
- [x] Server-side share tokens with full image data
- [x] Bilingual support (EN/ZH) with language-synced achievements
- [x] Achievement suggestions with 4 categories + AI generation
- [x] localStorage persistence (max 5, compressed photos)
- [x] Server-side JSON file persistence
- [x] Auto-restore last newspaper on page load
- [x] Responsive design (mobile + desktop)
- [x] Fallback chain for AI providers
- [x] Vercel Hobby plan compatible (10s function limit)

---

## 13. FUTURE ENHANCEMENTS

- [ ] User accounts (auth)
- [ ] Gallery of all created newspapers
- [ ] Download newspaper as PDF
- [ ] Social sharing (Twitter, WeChat, etc.)
- [ ] More achievement categories
- [ ] Custom newspaper names
- [ ] Multiple newspaper layouts
- [ ] Email capsule to future date
- [ ] Permanent server-side storage (database instead of /tmp JSON)

---

## 14. Git COMMANDS

```bash
# Initialize
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin git@github.com:miltonbabu/future-is-here.git
git branch -M main
git push -u origin main

# Update
git add .
git commit -m "Description of changes"
git push
```

---

## 15. DEPLOYMENT (Vercel)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import `future-is-here`
3. Add environment variables (Production environment):
   - `GLM_API_KEY` = your Zhipu GLM API key
   - `NEXT_PUBLIC_GLM_API_KEY` = same key (for client-side image generation)
   - `OPENAI_API_KEY` = your OpenAI key (optional)
4. Deploy
5. Verify: visit URL, test form, check function logs

**Important:** Without `NEXT_PUBLIC_GLM_API_KEY`, image generation will not work in production (browser can't call GLM directly).

**Vercel Hobby plan:** All API routes use `maxDuration = 10` (10-second function limit). Image generation happens client-side (30s timeout) to bypass this limit.

---

*This MF file is the single source of truth for recreating the Future Time Capsule app.*
