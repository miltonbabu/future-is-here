import { NextResponse } from "next/server";

// DALL-E 3 generation can take ~5-15s; allow up to 60s on Vercel Pro.
export const maxDuration = 60;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";

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
    // No key configured — illustration is optional, client handles null gracefully.
    return NextResponse.json(
      { error: "No image API key configured" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `[generate-image] OpenAI responded ${res.status}: ${text.slice(0, 200)}`,
      );
      return NextResponse.json(
        { error: `Image API error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.warn("[generate-image] OpenAI returned no b64_json");
      return NextResponse.json(
        { error: "No image data returned" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      src: `data:image/png;base64,${b64}`,
      provider: "openai",
    });
  } catch (err) {
    console.error("[generate-image] OpenAI fetch failed:", err);
    return NextResponse.json(
      { error: "Image generation request failed" },
      { status: 502 },
    );
  }
}
