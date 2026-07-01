# MASTER FILE (MF) — Future Time Capsule

> **Purpose**: This file contains every prompt, design decision, file structure, and step needed to recreate this app from scratch. Feed this to any AI agent along with the project folder, and it will produce the same app.

---

## 1. WHAT WE BUILT

**Future Time Capsule** — a web app where users type their name, team, and a future achievement, and AI generates a full vintage newspaper front page from that future year, complete with:
- AI-written newspaper article (headline + 3 paragraphs + quote + reward)
- AI-generated photorealistic illustration (no faces, futuristic scene)
- User's uploaded photo in a polaroid frame with sepia filter
- QR code for sharing
- Bilingual support (English + Chinese)
- Classic broadsheet newspaper aesthetic with real paper texture

Built at the **TRAE Friends Zhengzhou hackathon**.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Frontend | React 19.2, TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| AI Article | Zhipu GLM-4-Flash (primary), OpenAI gpt-4o-mini (fallback) |
| AI Image | Zhipu CogView-3-Plus (primary), OpenAI DALL-E 2 (fallback), SVG (last resort) |
| QR Codes | qrcode.react 4.2 |
| Storage (client) | localStorage |
| Storage (server) | File-based JSON (`.data/capsules.json`) |
| Deployment | Vercel |

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

### 3.3 Image Generation — Illustration Prompt
```
Photorealistic futuristic {year} scene, {article.image_prompt}, professional photography, high resolution, 8k, sharp focus, cinematic lighting, detailed textures, natural colors, vintage newspaper style photograph, warm sepia tones, aged paper texture overlay, documentary photography, no people, no faces, sci-fi elements, ultra realistic, photojournalism style
```

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
- Headlines: `Noto Serif SC`, `ZCOOL KuHei`, Plix, Ruizi JunXian, TASA Explorer, DianZi FangHei, XinYugong PinTi
- Body: `Noto Serif SC`, `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`

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
- Polaroid photo frame: 10px padding, 36px bottom, rotate -2deg, soft shadow, `#f4ead5` background

### 4.5 Photo Filter (Uploaded User Photo)
```css
filter: sepia(50%) saturate(140%) contrast(100%) brightness(108%) hue-rotate(-8deg);
```

### 4.6 AI Illustration
- Max height: `max-h-64` (256px) with `object-cover`
- Only shown if generation succeeds (no empty slots)
- Fallback: built-in SVG scenes (5 vintage-style illustrations)

---

## 5. PROJECT STRUCTURE

```
future-time-capsule/
├── app/
│   ├── api/
│   │   ├── capsules/
│   │   │   └── route.ts              # CRUD API for persistence (GET/POST/DELETE)
│   │   ├── generate-article/
│   │   │   └── route.ts              # Article generation (GLM → OpenAI → fallback templates)
│   │   └── generate-image/
│   │       └── route.ts              # Image generation (GLM CogView-3 → OpenAI DALL-E 2 → SVG)
│   ├── form/
│   │   └── page.tsx                  # Form page — input, photo upload, generation flow
│   ├── globals.css                   # All newspaper styles, textures, fonts, animations
│   ├── layout.tsx                    # Root layout, Google Fonts, metadata
│   └── page.tsx                      # Landing page + shared newspaper hash router
├── components/
│   ├── CapsuleForm.tsx               # Name/team/achievement form, photo upload, category chips
│   ├── Landing.tsx                   # Homepage — masthead, lead story, QR code, CTA
│   └── Newspaper.tsx                 # Generated newspaper rendering, QR code, share link
├── lib/
│   ├── db.ts                         # File-based JSON database (fs module)
│   ├── i18n.ts                       # EN/ZH translations + date formatting
│   ├── storage.ts                    # localStorage CRUD + DB sync
│   └── types.ts                      # TypeScript types (Language, ArticleData, CapsuleInput)
├── .env.example                      # API key placeholders
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
- `saveCapsule()` — saves to localStorage + POSTs to `/api/capsules`
- `getAllCapsules()` — reads from localStorage
- `loadCapsulesFromDb()` — fetches from `/api/capsules` and syncs to localStorage
- `deleteCapsule()` — removes from localStorage + DELETEs from API

### 6.4 `lib/db.ts`
- File-based JSON storage at `.data/capsules.json`
- Uses Node.js `fs` module (synchronous read/write)
- Functions: `saveCapsuleToDb()`, `getCapsuleFromDb()`, `getAllCapsulesFromDb()`, `deleteCapsuleFromDb()`

### 6.5 `app/api/generate-article/route.ts`
- **Provider chain**: GLM-4-Flash (primary) → OpenAI gpt-4o-mini (fallback) → pre-built templates (last resort)
- Per-provider timeout: 20 seconds
- Returns JSON: `{ article: ArticleData, provider: "glm" | "openai" | "fallback" }`
- 5 pre-built template categories: tech, ai, money, time, default (each with EN + ZH variants)
- Templates include headline, 3 paragraphs, quote, reward, and image prompt functions

### 6.6 `app/api/generate-image/route.ts`
- **Provider chain**: GLM CogView-3-Plus (primary) → OpenAI DALL-E 2 (fallback) → SVG generator (last resort)
- Per-provider timeout: 15 seconds
- GLM endpoint: `https://open.bigmodel.cn/api/paas/v4/images/generations`
- GLM params: `model: "cogview-3-plus"`, `size: "1024x1024"`, `quality: "hd"`
- Returns base64 data URL: `data:image/png;base64,...`
- SVG fallback: 5 vintage scenes (farmhouse, mountains, city skyline, trees, landscape) with sepia tones

### 6.7 `app/api/capsules/route.ts`
- `GET` — returns all capsules from JSON file
- `POST` — saves a capsule (insert or update by ID)
- `DELETE` — deletes by ID

### 6.8 `app/page.tsx` (Landing + Shared Newspaper)
- Reads URL hash: `#form` → redirects to `/form`
- Reads URL hash: `#<base64>` → decodes shared newspaper and displays it
- No hash → shows `Landing` component

### 6.9 `app/form/page.tsx` (Form + Generation Flow)
- `useEffect` on mount: loads from localStorage/DB, restores last newspaper if exists
- `handleGenerate()`:
  1. POST `/api/generate-article` with CapsuleInput
  2. POST `/api/generate-image` with illustration prompt (sequential, needs article's image_prompt)
  3. Save to localStorage + DB
  4. Encode newspaper data as base64 URL hash for sharing
  5. Show Newspaper component

### 6.10 `components/CapsuleForm.tsx`
- Form fields: name, team, future date (native date picker), achievement (textarea)
- Photo upload: two buttons — "Take Photo" (`capture="environment"`) and "Choose from Gallery"
- Photo stored as base64 data URL via `FileReader.readAsDataURL()`
- Achievement suggestions: 4 categories (tech, ai, money, time) + "All" filter
- "Surprise me" button — random achievement from selected category
- Language toggle button (EN ↔ 中文)
- `useEffect` on language change: re-rolls chips AND auto-selects new achievement in current language

### 6.11 `components/Landing.tsx`
- Layout: top bar → masthead → lead story → QR + CTA → footer
- QR code encodes `origin/#form` URL (bypasses landing page when scanned)
- CTA button navigates to `/form`
- Uses landing-specific fonts (Libre Caslon + Lora), NOT newspaper fonts

### 6.12 `components/Newspaper.tsx`
- Full broadsheet layout: masthead, byline, headline, drop-cap article, pull quote, reward
- Uploaded photo in polaroid frame with sepia filter
- AI illustration (if available) with caption
- QR code for sharing (encodes full newspaper URL with base64 hash)
- "Copy Link" button (copies full URL with hash)
- "Create Another" button (resets to form)
- QR error correction: `L` (max capacity)
- If share URL > 1500 chars, QR falls back to `/#form`

### 6.13 `app/globals.css`
- CSS variables for paper/ink/accent colors
- Year-shifted accent variables (near/mid/far)
- Font classes: `.h-headline`, `.h-body`, `.h-label` (newspaper), `.landing-headline`, `.landing-body`, `.landing-label` (landing)
- `.newspaper-paper` — real paper texture from transparenttextures.com
- `.polaroid-frame` — white border, thick bottom, rotate -2deg, shadow
- `.paper-grain` — dot gradient texture
- `.press-body` — justified text with hyphenation
- `.drop-cap` — large initial letter (4.2rem, accent color)
- `.press-spinner` — loading animation

### 6.14 `tailwind.config.ts`
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

---

## 8. ENVIRONMENT VARIABLES

| Variable | Required | Description |
|---|---|---|
| `GLM_API_KEY` | Yes | Zhipu GLM API key (article + image generation) |
| `OPENAI_API_KEY` | No | OpenAI API key (fallback for article + image) |

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
- `lib/storage.ts` — localStorage CRUD + DB sync via fetch
- `lib/db.ts` — file-based JSON storage using fs

### Step 7: Create API Routes
- `app/api/generate-article/route.ts` — GLM → OpenAI → fallback templates
- `app/api/generate-image/route.ts` — GLM CogView-3 → OpenAI DALL-E 2 → SVG
- `app/api/capsules/route.ts` — CRUD for persistence

### Step 8: Create Components
- `components/Landing.tsx` — masthead, lead story, QR, CTA
- `components/CapsuleForm.tsx` — form with photo upload, achievements, language toggle
- `components/Newspaper.tsx` — full newspaper render with QR and share

### Step 9: Create Pages
- `app/page.tsx` — landing + shared newspaper hash router
- `app/form/page.tsx` — form page with generation flow

### Step 10: Add Styles
- `app/globals.css` — all newspaper textures, fonts, animations, polaroid frame

### Step 11: Configure Environment
- `.env.local` — add `GLM_API_KEY` and `OPENAI_API_KEY`
- `.env.example` — placeholder template
- `.gitignore` — add `.env*.local`, `.trae/`, `.data/`

### Step 12: Test & Deploy
```bash
npm run dev          # local testing
npm run build        # production build
git push             # push to GitHub
# Import on Vercel → add env vars → deploy
```

---

## 10. API ENDPOINTS

| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/generate-article` | `{ name, team, achievement, futureDate, language, category }` | `{ article: ArticleData, provider: string }` |
| POST | `/api/generate-image` | `{ prompt: string }` | `{ src: "data:image/...", provider: string }` |
| GET | `/api/capsules` | — | `DbCapsule[]` |
| POST | `/api/capsules` | `DbCapsule` | `{ success: true }` |
| DELETE | `/api/capsules` | `{ id: string }` | `{ success: true }` |

---

## 11. KEY DESIGN DECISIONS

1. **GLM first, OpenAI second** — GLM is accessible in China; OpenAI often times out
2. **Sequential article→image** — image prompt depends on article's `image_prompt` field
3. **Base64 data URLs for photos** — survives re-renders, no blob URL revocation needed
4. **File-based JSON instead of SQLite** — no native compilation, works on Vercel
5. **URL hash encoding** — shareable newspaper links without a database lookup
6. **Separate font systems** — landing page uses serif (Caslon/Lora), newspaper uses typewriter (Special Elite/Courier Prime)
7. **Real paper texture** — transparenttextures.com PNG overlay, not CSS gradients
8. **SVG fallback illustrations** — 5 vintage scenes that match newspaper aesthetic
9. **Language sync** — switching language re-rolls achievement chips AND input text
10. **QR capacity safety** — strips image data from shared URL, falls back to `/#form` if too long

---

## 12. MVP FEATURES

- [x] Landing page with QR code and CTA
- [x] Form with name, team, achievement, photo upload, date picker
- [x] AI article generation (GLM-4-Flash)
- [x] AI image generation (CogView-3-Plus)
- [x] Newspaper rendering with vintage broadsheet aesthetic
- [x] Polaroid photo frame with sepia filter
- [x] QR code for sharing
- [x] Copy link button
- [x] Bilingual support (EN/ZH)
- [x] Achievement suggestions with categories
- [x] "Surprise me" random achievement
- [x] localStorage persistence
- [x] Server-side JSON file persistence
- [x] Auto-restore last newspaper on page load
- [x] Responsive design (mobile + desktop)
- [x] Fallback chain for AI providers
- [x] SVG fallback illustrations

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
3. Add environment variables:
   - `GLM_API_KEY` = your key
   - `OPENAI_API_KEY` = your key (optional)
4. Deploy
5. Verify: visit URL, test form, check function logs

**Note:** `maxDuration = 60` requires Vercel Pro. On Hobby plan, change to `maxDuration = 10`.

---

*This MF file is the single source of truth for recreating the Future Time Capsule app.*
