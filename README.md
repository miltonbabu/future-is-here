# Future Time Capsule

**Your face, your name, your wildest achievement — printed on the front page of a newspaper from the future.**

Built at the TRAE Friends Zhengzhou hackathon. Type a name, a team, and an achievement. Our AI press writes a full broadsheet front page dated any year you choose, starring you.

---

## How it works

1. Upload a photo (stays in your browser — never uploaded)
2. Type your name, team, and a future achievement (or let us surprise you)
3. Pick a future date — any year
4. AI generates a full newspaper front page with headline, article, pull quote, reward, and illustration
5. Share it with a QR code or link

Supports English and 中文.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS** — classic broadsheet newspaper design
- **AI article generation** — Zhipu GLM-4-Flash (production), OpenAI GPT-4o-mini (optional)
- **AI image generation** — Trae endpoint (default), OpenAI gpt-image-2 (optional)
- **QR codes** — qrcode.react
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
| `GLM_API_KEY` | Yes | Zhipu GLM-4-Flash API key for article generation |
| `OPENAI_API_KEY` | No | OpenAI API key for article + image generation. Falls back to GLM + Trae if absent |

---

## API routes

| Route | Description |
|---|---|
| `POST /api/generate-article` | Generates a newspaper article from user input |
| `POST /api/generate-image` | Generates an AI illustration (falls back to Trae if OpenAI unreachable) |

---

## Project structure

```
app/
  api/
    generate-article/route.ts    # Article generation (GLM → OpenAI → pre-built fallback)
    generate-image/route.ts      # Image generation (OpenAI → Trae fallback)
  globals.css                    # Newspaper styles, typography, textures
  layout.tsx                     # Root layout, Google Fonts
  page.tsx                       # Main page — view routing + state
components/
  CapsuleForm.tsx                # Name, team, achievement, photo, language toggle
  Landing.tsx                    # Homepage — QR code, CTA, masthead
  Newspaper.tsx                  # Generated newspaper rendering
lib/
  i18n.ts                        # EN/ZH translations
  types.ts                       # TypeScript types
```

---

## License

MIT