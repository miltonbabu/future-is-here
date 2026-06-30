import { NextResponse } from "next/server";

// gpt-image-2 generation can take ~10-30s; allow up to 60s on Vercel.
export const maxDuration = 60;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";

// Public, key-less fallback (no faces — decorative scene only).
function traeFallbackUrl(prompt: string): string {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt,
  )}&image_size=landscape_4_3`;
}

export async function POST(req: Request) {
  let prompt: string;
  try {
    const body = await req.json();
    prompt = body?.prompt;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key configured — use the key-less Trae illustration endpoint.
    return NextResponse.json({ src: traeFallbackUrl(prompt), provider: "trae" });
  }

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt,
        n: 1,
        size: "1536x1024", // 3:2 landscape, both edges multiples of 16
        quality: "low", // fast + cheap; image is decorative with heavy CSS filters
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `[generate-image] OpenAI responded ${res.status}: ${text.slice(0, 200)}`,
      );
      return NextResponse.json(
        { src: traeFallbackUrl(prompt), provider: "trae" },
      );
    }

    const data = await res.json();
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.warn("[generate-image] OpenAI returned no b64_json, falling back");
      return NextResponse.json(
        { src: traeFallbackUrl(prompt), provider: "trae" },
      );
    }

    return NextResponse.json({
      src: `data:image/png;base64,${b64}`,
      provider: "openai",
    });
  } catch (err) {
    console.error("[generate-image] OpenAI fetch failed, falling back:", err);
    return NextResponse.json({ src: traeFallbackUrl(prompt), provider: "trae" });
  }
}
