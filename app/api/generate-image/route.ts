import { NextResponse } from "next/server";

export const maxDuration = 10;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";
const GLM_IMAGE_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/images/generations";
const PROVIDER_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function generateFallbackIllustration(prompt: string): string {
  const randomSeed = prompt.length % 100;
  const seed = Math.floor(randomSeed);

  const backgrounds = [
    { bg: "#f4ead5", sky: "#d4c4a8" },
    { bg: "#e8dcc8", sky: "#c4b498" },
    { bg: "#f0e6d0", sky: "#d8c8aa" },
  ];
  const bg = backgrounds[seed % backgrounds.length];

  const scenes = [
    `<rect x="0" y="0" width="512" height="512" fill="${bg.bg}"/>
     <rect x="0" y="0" width="512" height="200" fill="${bg.sky}"/>
     <circle cx="400" cy="60" r="40" fill="#f5d76e"/>
     <path d="M100 200 L100 400 L300 400 L300 280 Z" fill="#8b6914" stroke="#5c4510" stroke-width="2"/>
     <path d="M80 200 L80 420 L320 420 L320 260 Z" fill="#a08040" opacity="0.6"/>
     <path d="M200 200 L200 280 L100 400 L300 400 Z" fill="#8b6914"/>
     <rect x="140" y="320" width="120" height="80" fill="#f4ead5" stroke="#5c4510" stroke-width="2"/>
     <rect x="160" y="340" width="40" height="40" fill="#d4c4a8"/>
     <rect x="210" y="340" width="40" height="40" fill="#d4c4a8"/>`,
    `<rect x="0" y="0" width="512" height="512" fill="${bg.bg}"/>
     <rect x="0" y="0" width="512" height="250" fill="${bg.sky}"/>
     <path d="M0 250 Q128 200 256 250 T512 250 L512 512 L0 512 Z" fill="#6b8e23" stroke="#4a6718" stroke-width="2"/>
     <circle cx="80" cy="80" r="50" fill="#f5d76e"/>
     <path d="M60 70 L70 90 L90 60" fill="none" stroke="#f5d76e" stroke-width="4"/>
     <rect x="180" y="350" width="150" height="120" fill="#8b7355" stroke="#5c4a30" stroke-width="3"/>
     <rect x="190" y="360" width="50" height="50" fill="#d4c4a8"/>
     <rect x="250" y="360" width="50" height="50" fill="#d4c4a8"/>
     <circle cx="225" cy="430" r="20" fill="#6b4423"/>`,
    `<rect x="0" y="0" width="512" height="512" fill="${bg.bg}"/>
     <rect x="0" y="0" width="512" height="220" fill="${bg.sky}"/>
     <path d="M50 220 L50 450 L100 450 L100 300 L150 300 L150 450 L200 450 L200 250 L250 250 L250 450 L300 450 L300 280 L350 280 L350 450 L400 450 L400 220 Z" fill="#708090" stroke="#4a5568" stroke-width="2"/>
     <circle cx="380" cy="60" r="35" fill="#f5d76e"/>
     <rect x="100" y="220" width="50" height="80" fill="#5c6e80"/>
     <rect x="200" y="220" width="50" height="60" fill="#4a5568"/>
     <rect x="300" y="220" width="50" height="100" fill="#5c6e80"/>`,
    `<rect x="0" y="0" width="512" height="512" fill="${bg.bg}"/>
     <rect x="0" y="0" width="512" height="180" fill="${bg.sky}"/>
     <circle cx="350" cy="50" r="45" fill="#f5d76e"/>
     <ellipse cx="256" cy="450" rx="256" ry="62" fill="#8b6914" opacity="0.5"/>
     <path d="M256 450 L200 350 L220 350 L200 280 L230 320 L256 260 L282 320 L312 280 L292 350 L312 350 Z" fill="#8b7355" stroke="#5c4a30" stroke-width="2"/>
     <circle cx="100" cy="400" r="30" fill="#6b8e23" opacity="0.7"/>
     <circle cx="400" cy="420" r="25" fill="#6b8e23" opacity="0.7"/>`,
    `<rect x="0" y="0" width="512" height="512" fill="${bg.bg}"/>
     <rect x="0" y="0" width="512" height="200" fill="${bg.sky}"/>
     <circle cx="100" cy="70" r="30" fill="#f5d76e"/>
     <path d="M0 400 Q128 350 256 400 T512 400 L512 512 L0 512 Z" fill="#4a6718"/>
     <rect x="150" y="280" width="200" height="120" fill="${bg.sky}"/>
     <rect x="170" y="300" width="80" height="80" fill="#d4c4a8"/>
     <rect x="260" y="300" width="80" height="80" fill="#d4c4a8"/>
     <line x1="250" y1="300" x2="250" y2="380" stroke="#5c4510" stroke-width="2"/>`,
  ];

  const scene = scenes[seed % scenes.length];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
${scene}
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function tryGLM(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      GLM_IMAGE_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "cogview-3-plus",
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      },
      PROVIDER_TIMEOUT_MS,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[generate-image] GLM responded ${res.status}: ${text.slice(0, 200)}`,
      );
      return null;
    }

    const data = await res.json();
    const imgUrl: string | undefined = data?.data?.[0]?.url;
    if (!imgUrl) {
      console.error("[generate-image] GLM returned no image URL");
      return null;
    }

    // Return the URL directly — fetching + base64 conversion adds a second
    // network round-trip that exceeds Vercel's 10s function limit.
    return imgUrl;
  } catch (err) {
    console.error("[generate-image] GLM request failed:", err);
    return null;
  }
}

async function tryOpenAI(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      OPENAI_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      },
      PROVIDER_TIMEOUT_MS,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[generate-image] OpenAI responded ${res.status}: ${text.slice(0, 200)}`,
      );
      return null;
    }

    const data = await res.json();
    const imgUrl: string | undefined = data?.data?.[0]?.url;
    if (!imgUrl) {
      console.error("[generate-image] OpenAI returned no image URL");
      return null;
    }

    // Return URL directly to save time within Vercel's 10s limit.
    return imgUrl;
  } catch (err) {
    console.error("[generate-image] OpenAI request failed:", err);
    return null;
  }
}

export async function POST(req: Request) {
  let prompt: string;
  try {
    const body = await req.json();
    prompt = body?.prompt;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const glmKey = process.env.GLM_API_KEY;

  if (!glmKey && !openaiKey) {
    return NextResponse.json({
      src: generateFallbackIllustration(prompt),
      provider: "fallback",
    });
  }

  let result: string | null = null;
  let provider = "fallback";

  if (glmKey) {
    result = await tryGLM(prompt, glmKey);
    if (result) provider = "glm";
  }

  if (!result && openaiKey) {
    result = await tryOpenAI(prompt, openaiKey);
    if (result) provider = "openai";
  }

  if (result) {
    return NextResponse.json({ src: result, provider });
  }

  return NextResponse.json({
    src: generateFallbackIllustration(prompt),
    provider: "fallback",
  });
}
