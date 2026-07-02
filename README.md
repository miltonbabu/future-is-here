<div align="center">

# 🗞️ Future Time Capsule

### Your face, your name, your wildest achievement — printed on the front page of a newspaper from the future.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GLM](https://img.shields.io/badge/AI-GLM--4--Flash-4F46E5?logo=openai&logoColor=white)](https://open.bigmodel.cn/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<p>

**Built at [TRAE Friends](https://www.trae.ai/) Zhengzhou Hackathon** · 2026

</p>

<p>
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-how-it-works">⚙️ How It Works</a> •
  <a href="#-tech-stack">🧱 Tech Stack</a> •
  <a href="#-design-system">🎨 Design System</a> •
  <a href="#-deployment">📦 Deployment</a>
</p>

---

</div>

## 📰 The Pitch

> We didn't build a time machine. We built a **time capsule**.

Type a name, a team, and an achievement. Pick a future date. Upload a photo.

In seconds, our AI press room writes a full **broadsheet newspaper front page** dated that future year — with a headline, lead story, pull quote, reward, AI-generated illustration, and your photo in a vintage polaroid frame.

Then **share it** via QR code or link. Open it on any device. The newspaper persists — images included.

**Bilingual:** English & 中文.

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🤖 AI-Powered Generation
- **Articles** — GLM-4-Flash writes a 7-field broadsheet story
- **Illustrations** — CogView-3-Plus generates photorealistic sepia images
- **Achievements** — "Surprise Me" generates funny futuristic achievements
- **Client-side images** — Browser calls GLM directly (bypasses server timeouts)

</td>
<td width="50%" valign="top">

### 📄 Vintage Newspaper Aesthetic
- Real scanned paper texture (`#f4ead5` base)
- Special Elite + Courier Prime (typewriter fonts)
- Drop caps, column rules, justified text
- Polaroid photo frame with sepia filter
- Deep red accent (`#781e1e`) for seals

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🌐 Share & Persist
- **9-character share tokens** (e.g. `/share/abc123xyz`)
- **Upstash Redis** for production share storage (30-day TTL)
- **Image persistence** — AI illustrations downloaded → base64 on save
- **localStorage archive** — "My Newspapers" button (up to 20 saved)
- **QR codes** — scan to open the exact newspaper

</td>
<td width="50%" valign="top">

### 🌍 Bilingual & Responsive
- **English + 中文** — toggle syncs all UI, achievements, and fonts
- Language-aware AI prompts (prompts adapt to selected language)
- **Mobile-first** responsive design
- **Local network access** — self-host on PC, access from phone on same WiFi

</td>
</tr>
</table>

---

## ⚙️ How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Upload    │     │   AI Press   │     │   Newspaper     │
│   Photo     │────▶│   Room       │────▶│   Front Page    │
│   + Form    │     │              │     │                 │
└─────────────┘     └──────────────┘     └────────┬────────┘
                           │                       │
                    ┌──────┴──────┐         ┌───────┴───────┐
                    │  GLM-4-Flash│         │  QR + Share   │
                    │  (article)  │         │  Link + PNG   │
                    └─────────────┘         │  Download     │
                           │                └───────────────┘
                    ┌──────┴──────┐
                    │ CogView-3-  │
                    │ Plus (img)  │
                    │ client-side │
                    └─────────────┘
```

1. **Upload a photo** — compressed to 400×500px JPEG @ 0.7 (stays in browser as base64)
2. **Fill the form** — name, team, achievement (or "Surprise Me"), future date
3. **AI generates** — article (server-side GLM) + illustration (client-side GLM) run in parallel
4. **Newspaper renders** — full broadsheet with headline, story, pull quote, reward, photo, illustration
5. **Share it** — QR code, copy link, or download as PNG
6. **Archive** — saved to localStorage + server; view anytime via "My Newspapers"

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Zhipu GLM API key](https://open.bigmodel.cn/) (free tier available)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/miltonbabu/future-is-here.git
cd future-is-here

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GLM_API_KEY

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 📱 Access from Phone (Same WiFi)

The dev server binds to `0.0.0.0` so you can access it from your phone:

```bash
# Find your PC's local IP (Windows)
ipconfig

# On your phone, open:
# http://<YOUR-PC-IP>:3000
```

> Example: `http://10.60.177.85:3000`

---

## 🧱 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16.2.9 (App Router, Turbopack) | Modern React framework with SSR |
| **UI** | React 19.2 + Tailwind CSS 3.4 | Fast, responsive, utility-first styling |
| **Language** | TypeScript 5.5 | Type safety |
| **Article AI** | Zhipu GLM-4-Flash (server-side) | Accessible in China, fast, free tier |
| **Image AI** | Zhipu CogView-3-Plus (client-side) | Bypasses Vercel's 10s function limit |
| **Achievement AI** | Zhipu GLM-4-Flash | Category-aware funny achievement generation |
| **QR Codes** | qrcode.react 4.2 | SVG QR codes for sharing |
| **Image Export** | html-to-image 1.11 | Download newspaper as PNG |
| **Prod Storage** | Upstash Redis | Serverless, persistent share tokens |
| **Dev Storage** | File-based JSON (`/tmp/.data/`) | No external dependency for local dev |
| **Client Storage** | localStorage (20 max) | Offline archive of saved newspapers |

---

## 🎨 Design System

<table>
<tr>
<td width="50%" valign="top">

### Colors

| Element | Hex |
|---|---|
| Paper background | `#f4ead5` |
| Ink (text) | `#1c1612` |
| Accent (seal) | `#781e1e` |
| Photo filter | `sepia(50%) saturate(140%)` |

</td>
<td width="50%" valign="top">

### Typography

| Element | Font |
|---|---|
| Newspaper headline (EN) | Special Elite |
| Newspaper body (EN) | Courier Prime |
| Landing headline (EN) | Libre Caslon Display |
| Landing body (EN) | Lora |
| Headline (中文) | ZCOOL KuHei, Noto Serif SC |
| Body (中文) | Noto Sans SC, PingFang SC |

</td>
</tr>
</table>

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GLM_API_KEY` | ✅ Yes | Zhipu GLM API key (server-side: articles + achievements) |
| `NEXT_PUBLIC_GLM_API_KEY` | ✅ Yes | Same key, exposed to client for browser-side image generation |
| `UPSTASH_REDIS_REST_URL` | 🔄 Prod only | Upstash Redis REST URL (auto-set by Vercel integration) |
| `UPSTASH_REDIS_REST_TOKEN` | 🔄 Prod only | Upstash Redis REST token (auto-set by Vercel integration) |
| `OPENAI_API_KEY` | ❌ Optional | Rarely used; OpenAI is unreachable in China |

---

## 📡 API Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate-article` | Generate a 7-field newspaper article (GLM → template fallback) |
| `POST` | `/api/generate-achievement` | Generate 3 funny achievements by category + language |
| `POST` | `/api/generate-image` | Server-side image fallback (rarely used — images are client-side) |
| `POST` | `/api/share` | Save newspaper → get 9-char share token (Redis/file) |
| `GET` | `/api/share/:token` | Retrieve shared newspaper by token |
| `GET` | `/api/capsules` | List all saved capsules (file JSON) |
| `POST` | `/api/capsules` | Save a capsule |
| `DELETE` | `/api/capsules` | Delete a capsule by ID |

---

## 📁 Project Structure

<details>
<summary>Click to expand</summary>

```
future-time-capsule/
├── app/
│   ├── api/
│   │   ├── capsules/route.ts            # CRUD for archive sync
│   │   ├── generate-achievement/route.ts # AI "Surprise Me" (GLM)
│   │   ├── generate-article/route.ts    # Article generation (GLM → fallback)
│   │   ├── generate-image/route.ts      # Server-side image fallback
│   │   └── share/
│   │       ├── route.ts                 # POST: create share token (Redis/file)
│   │       └── [token]/route.ts         # GET: fetch shared newspaper
│   ├── form/page.tsx                    # Form + client-side image gen + archive
│   ├── share/[token]/page.tsx           # Shared newspaper view
│   ├── globals.css                      # All styles, textures, fonts
│   ├── layout.tsx                       # Root layout, Google Fonts
│   └── page.tsx                         # Landing + share hash router
├── components/
│   ├── CapsuleForm.tsx                  # Form, photo upload, AI "Surprise Me"
│   ├── Landing.tsx                      # Homepage with QR → /form, CTA
│   └── Newspaper.tsx                    # Newspaper render, QR → /share/token
├── lib/
│   ├── db.ts                            # File JSON database (fs, /tmp on Vercel)
│   ├── i18n.ts                          # EN/ZH translations + date formatting
│   ├── storage.ts                       # localStorage CRUD (20 max) + DB sync
│   └── types.ts                         # TypeScript types
├── .trae/documents/                     # Project documentation
│   ├── MF.md                            # Master File (recreation guide)
│   ├── HACKATHON-SPEECH.md              # Presentation speech
│   ├── future-time-capsule-mvp.md       # MVP plan (English)
│   └── future-time-capsule-mvp-zh.md    # MVP plan (中文)
├── .env.example                         # API key placeholders
├── package.json                         # dev & start: -H 0.0.0.0
└── tailwind.config.ts                   # Theme (fonts, colors)
```

</details>

---

## 📦 Deployment

### Option 1: Vercel (Production)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variables:
   - `GLM_API_KEY`
   - `NEXT_PUBLIC_GLM_API_KEY` (same value)
4. (Optional) Add **Upstash Redis** integration from Vercel dashboard for persistent shares
5. Deploy

### Option 2: Self-Hosted (Local Network)

```bash
# Build for production
npm run build

# Start production server (binds to 0.0.0.0)
npm start

# Access from any device on same WiFi:
# http://<YOUR-PC-IP>:3000
```

> **Why self-host?** No Vercel 10s function limit → longer AI generation timeouts → more reliable on slow networks.

---

## 🔧 Key Engineering Decisions

<details>
<summary>Click to expand</summary>

1. **Client-side image generation** — CogView takes 10-15s, exceeding Vercel's 10s function limit. Browser calls GLM directly with a 30s timeout.
2. **GLM over OpenAI** — GLM is accessible in China; OpenAI endpoints timeout. OpenAI fallback removed entirely.
3. **Upstash Redis for shares** — Vercel's filesystem is ephemeral. Redis persists shared newspapers across instances.
4. **Image persistence as base64** — CogView image URLs expire. On share save, server downloads the image and converts to base64 data URL.
5. **Environment-aware timeouts** — 5s on Vercel (10s function limit), 30s self-hosted (no limit).
6. **No SVG image fallback** — If image generation fails, newspaper renders without illustration (no empty slot).
7. **Photo compression** — 400×500px JPEG @ 0.7 (~50-100KB) prevents localStorage quota errors.
8. **Hydration-safe QR codes** — `window.location.origin` computed in `useEffect`, not during render.

</details>

---

## 📚 Documentation

All project docs are in [`.trae/documents/`](.trae/documents/):

| File | Purpose |
|---|---|
| [MF.md](.trae/documents/MF.md) | **Master File** — Complete recreation guide with all prompts. Copy this file → AI agent rebuilds the app. |
| [HACKATHON-SPEECH.md](.trae/documents/HACKATHON-SPEECH.md) | Presentation speech for the hackathon demo |
| [future-time-capsule-mvp.md](.trae/documents/future-time-capsule-mvp.md) | MVP implementation plan (English) |
| [future-time-capsule-mvp-zh.md](.trae/documents/future-time-capsule-mvp-zh.md) | MVP implementation plan (中文) |

---

## 🏆 Acknowledgments

- **[TRAE Friends](https://www.trae.ai/)** — Hackathon platform
- **[Zhipu AI](https://open.bigmodel.cn/)** — GLM-4-Flash & CogView-3-Plus
- **[Upstash](https://upstash.com/)** — Serverless Redis
- **[transparenttextures.com](https://www.transparenttextures.com/)** — Paper texture

---

## 📄 License

MIT — see [LICENSE](LICENSE) file.

---

<div align="center">

**We didn't build a time machine. We built a time capsule.** 🗞️

</div>
