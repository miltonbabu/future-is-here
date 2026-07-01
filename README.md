# Future Time Capsule

**Your face, your name, your wildest achievement — printed on the front page of a newspaper from the future.**

Built at the TRAE Friends Zhengzhou hackathon. Type a name, a team, and an achievement. Our AI press writes a full broadsheet front page dated any year you choose, starring you.

---

## MVP Features

- Landing page with QR code and "Enter the Press" CTA
- Form: name, team, future date, achievement (with category suggestions + "Surprise me")
- Photo upload: camera + gallery (stays in browser as base64, never uploaded)
- AI article generation: GLM-4-Flash (primary) → OpenAI (fallback) → pre-built templates
- AI image generation: CogView-3-Plus (primary) → DALL-E 2 (fallback) → SVG scenes
- Vintage broadsheet newspaper with real paper texture, drop cap, polaroid photo frame
- QR code sharing + copy link
- Bilingual: English + 中文 (language toggle syncs all UI + achievements)
- Persistence: localStorage + server-side JSON file (auto-restore on refresh)
- Responsive: mobile + desktop

---

## How it works

1. Upload a photo (stays in your browser — never uploaded)
2. Type your name, team, and a future achievement (or let us surprise you)
3. Pick a future date — any year
4. AI generates a full newspaper front page with headline, article, pull quote, reward, and illustration
5. Share it with a QR code or link
6. Refresh-safe: your last newspaper auto-restores on page reload

Supports English and 中文.

---

## Tech stack

- **Next.js 16.2.9** (App Router, Turbopack)
- **React 19.2** + **TypeScript 5.5**
- **Tailwind CSS 3.4** — classic broadsheet newspaper design
- **AI article generation** — Zhipu GLM-4-Flash (primary), OpenAI gpt-4o-mini (fallback)
- **AI image generation** — Zhipu CogView-3-Plus (primary), OpenAI DALL-E 2 (fallback), SVG (last resort)
- **QR codes** — qrcode.react 4.2
- **Storage** — localStorage (client) + file-based JSON (server)
- **Deployment** — Vercel

---

## Getting started

```bash
npm install
```

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

```
GLM_API_KEY=your_glm_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # optional
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GLM_API_KEY` | Yes | Zhipu GLM API key (article + image generation) |
| `OPENAI_API_KEY` | No | OpenAI API key (fallback for article + image generation) |

---

## API routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/generate-article` | Generates a newspaper article (GLM → OpenAI → templates) |
| POST | `/api/generate-image` | Generates an AI illustration (GLM → OpenAI → SVG) |
| GET | `/api/capsules` | Returns all saved capsules |
| POST | `/api/capsules` | Saves a capsule to server storage |
| DELETE | `/api/capsules` | Deletes a capsule by ID |

---

## Project structure

```
app/
  api/
    capsules/route.ts            # CRUD API for persistence
    generate-article/route.ts    # Article generation (GLM → OpenAI → fallback)
    generate-image/route.ts      # Image generation (GLM → OpenAI → SVG)
  form/page.tsx                  # Form page — input, photo, generation flow
  globals.css                    # Newspaper styles, textures, fonts
  layout.tsx                     # Root layout, Google Fonts
  page.tsx                       # Landing + shared newspaper hash router
components/
  CapsuleForm.tsx                # Form with photo upload, achievements, language toggle
  Landing.tsx                    # Homepage — QR code, CTA, masthead
  Newspaper.tsx                  # Generated newspaper rendering
lib/
  db.ts                          # File-based JSON database
  i18n.ts                        # EN/ZH translations + date formatting
  storage.ts                     # localStorage + DB sync
  types.ts                       # TypeScript types
```

---

## Design system

| Element | Value |
|---|---|
| Paper background | `#f4ead5` (aged newsprint) |
| Ink color | `#1c1612` (brown-black) |
| Accent | `#781e1e` (deep red seal) |
| Newspaper headline font | Special Elite (distressed typewriter) |
| Newspaper body font | Courier Prime (typewriter) |
| Landing headline font | Libre Caslon Display (classic serif) |
| Landing body font | Lora (readable serif) |
| Chinese headline font | Noto Serif SC, ZCOOL KuHei |
| Chinese body font | Noto Serif SC, Noto Sans SC |
| Paper texture | transparenttextures.com/cream-paper.png |
| Photo filter | sepia(50%) saturate(140%) brightness(108%) hue-rotate(-8deg) |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables (`GLM_API_KEY`, `OPENAI_API_KEY`)
4. Deploy

**Note:** `maxDuration = 60` requires Vercel Pro. On Hobby plan, change to `maxDuration = 10`.

---

## License

MIT
