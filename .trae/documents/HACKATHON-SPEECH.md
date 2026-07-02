# Hackathon Speech — Future Time Capsule
**TRAE Friends Zhengzhou Hackathon**

---

## The Pitch (30 seconds)

What if you could peek into the future and see tomorrow's newspaper — with YOU on the front page?

That's Future Time Capsule. You type your name, your team, and a wild future achievement. You upload a photo. And in seconds, AI writes a full vintage newspaper front page from the year 2032 — complete with a witty article, a photorealistic illustration, your photo in a sepia polaroid frame, and a QR code to share it with the world.

It's part time machine. Part creativity engine. Part newspaper press. All powered by AI.

---

## The Problem (Why We Built This)

At every hackathon, people build incredible things. But the moment ends. The code goes to GitHub. The demo fades. The excitement dies.

We wanted to capture that moment — to freeze it in time, like a newspaper clipping you'd find in an attic decades later. A tangible, shareable, beautiful artifact that says: **"Here's who you became. Here's what you achieved. Here's your front page."**

And we wanted it to feel real. Not a generic AI text dump. A **real newspaper** — with typography, texture, columns, a polaroid photo, an illustration, a masthead. Something you'd want to print and frame.

---

## What It Does (Demo Flow)

1. **Landing page** — A classic broadsheet masthead greets you. "THE FUTURE TIMES." A QR code and "Enter the Press" button invite you in.

2. **The Form** — Enter your name, team, and a future achievement. Not sure what to write? Hit **"Surprise Me"** — AI generates funny, category-specific achievements for you. Pick a date in the future. Upload a photo (camera or gallery). Choose English or Chinese.

3. **The Magic** — Hit generate. In the background:
   - **GLM-4-Flash** writes a full newspaper article — headline, three paragraphs, a first-person quote, and a reward line
   - **CogView-3-Plus** generates a photorealistic illustration — no faces, just the scene, in sepia tones
   - Your photo gets a polaroid frame with a vintage sepia filter
   - A share token is created server-side so anyone can view your newspaper via QR code

4. **The Newspaper** — A full broadsheet front page renders. Real paper texture. Drop cap. Justified columns. Pull quote. Your photo. AI illustration. A QR code that links to your newspaper. A "Copy Link" button. A "Download as PNG" button.

5. **Share It** — Scan the QR code with your phone. Open the link. The full newspaper — with all images — loads for anyone, anywhere.

6. **Archive** — Every newspaper you create is saved locally. Click "My Newspapers" to browse, reopen, or delete your collection.

---

## How We Built It (Technical Highlights)

### The Architecture
- **Next.js 16** App Router with Turbopack — fast dev, production-ready
- **React 19** + TypeScript for a type-safe, component-driven UI
- **Tailwind CSS** for the vintage newspaper aesthetic
- **Zhipu GLM** for all AI — article generation (GLM-4-Flash), image generation (CogView-3-Plus), and achievement suggestions (GLM-4-Flash)

### The Hard Problems We Solved

**1. Vercel's 10-second function limit kills AI image generation.**
CogView-3-Plus takes 10-15 seconds to generate an image. Vercel's Hobby plan caps serverless functions at 10 seconds. So we moved image generation **client-side** — the browser calls GLM directly with a 30-second timeout. The server never times out. The user never waits for a 502 error.

**2. Sharing newspapers with images is hard.**
Base64-encoded newspaper data in URL hashes exceeded QR code capacity. So we built server-side share tokens — a 9-character code that stores the full newspaper (article + images + metadata) in a JSON file. The QR code encodes a short URL. Anyone scanning sees the complete newspaper.

**3. Photos disappeared on refresh.**
Full-resolution photos exceeded localStorage's 5MB limit. We compress photos to 400×500px JPEG at 0.7 quality (~50-100KB) via canvas before storing. Now they survive refreshes, share links, and archive browsing.

**4. AI should fail gracefully.**
If GLM is down, the newspaper still generates — with pre-built template articles (5 categories, bilingual). If image generation fails, the newspaper shows without an illustration (no empty slot, no broken image). The show always goes on.

**5. It should work on your phone — without deploying.**
We bound the dev and production servers to `0.0.0.0`. Run `npm start` on your PC, open `http://<your-PC-IP>:3000` on your phone (same WiFi), and generate newspapers from your couch. Both article and image generation work — the article runs server-side on your PC, the image generates client-side in your phone's browser.

**6. Bilingual from day one.**
Every UI string, every achievement, every newspaper article, every AI prompt supports English and Chinese. Switching language re-rolls achievement suggestions in the new language. The newspaper even uses different fonts — Special Elite and Courier Prime for English, Noto Serif SC and ZCOOL KuHei for Chinese.

### The Design
- **Real paper texture** from transparenttextures.com with multiply blend mode — not synthetic CSS gradients
- **Three font systems**: newspaper (Special Elite + Courier Prime), landing (Libre Caslon + Lora), Chinese (Noto Serif SC + ZCOOL KuHei)
- **Year-shifted color accents** — deep red for near future (2025-2030), ink blue for mid (2031-2040), aged gold for far (2041+)
- **Polaroid frame** matches the paper color (`#f4ead5`), not white — so it looks like a photo taped into an old newspaper, not a sticker

---

## Why GLM?

We chose Zhipu's GLM as our AI backbone for three reasons:

1. **Accessible in China** — OpenAI's API is unreachable from Chinese networks. GLM is built by Zhipu AI, a Chinese company, and works reliably.
2. **Fast** — GLM-4-Flash responds in 3-8 seconds for article generation. Perfect for a live demo.
3. **CogView-3-Plus** generates photorealistic images — not illustrations, not art. Actual photo-like scenes that look like they belong in a vintage newspaper.

One API key. Three models. Article, image, and achievements. Clean.

---

## What Makes This Special

- **It's not a chatbot.** It's a creative artifact generator. You don't talk to it — you fill a form and get a finished product.
- **It's bilingual.** Real bilingual — not Google Translate. The AI writes native-quality articles in both languages.
- **It's shareable.** QR codes, share links, PNG downloads. Your newspaper can go anywhere.
- **It's resilient.** AI fails? Templates kick in. Image fails? Newspaper still renders. Network fails? localStorage keeps your history.
- **It's beautiful.** Real paper texture. Vintage typography. Sepia tones. Drop caps. Polaroid frames. This isn't a generic AI output — it's a designed experience.
- **It works offline-ish.** Run it on your laptop. Access from your phone. No deployment needed.

---

## The Team

Built at **TRAE Friends Zhengzhou** — a hackathon about friendship, creativity, and building the future together.

We came for the pizza. We stayed for the newspaper.

---

## Try It

1. **Live:** `future-is-here.vercel.app`
2. **Local:** `npm start` → open `http://localhost:3000`
3. **Phone (same WiFi):** `http://<your-PC-IP>:3000`

Type your name. Pick a team. Describe your future achievement. Upload a photo.

**Get your front page.**

---

## Closing Line

> *"We didn't build a time machine. We built a time capsule — one that asks AI to imagine who you'll become, and prints it on tomorrow's front page today."*

---

*Future Time Capsule — TRAE Friends Zhengzhou, July 2026*
