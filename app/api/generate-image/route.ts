import { NextResponse } from "next/server";

// DALL-E 2 generation takes ~2-5s. Keep within Hobby plan 10s limit.
export const maxDuration = 10;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/generations";

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
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[generate-image] OpenAI responded ${res.status}: ${text.slice(0, 300)}`,
      );
      return NextResponse.json(
        { error: `OpenAI image API error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    // DALL-E 2 returns a URL by default. Fetch it and convert to base64
    // so the newspaper can display it as a data URL (survives sharing).
    const imgUrl: string | undefined = data?.data?.[0]?.url;
    if (!imgUrl) {
      console.error("[generate-image] OpenAI returned no image URL");
      return NextResponse.json(
        { error: "No image data returned" },
        { status: 502 },
      );
    }

    // Fetch the image and convert to base64 data URL
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) {
      console.error(`[generate-image] Failed to fetch image: ${imgRes.status}`);
      return NextResponse.json(
        { error: "Failed to download generated image" },
        { status: 502 },
      );
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      src: `data:image/png;base64,${b64}`,
      provider: "openai",
    });
  } catch (err) {
    console.error("[generate-image] Request failed:", err);
    return NextResponse.json(
      { error: "Image generation request failed" },
      { status: 502 },
    );
  }
}
