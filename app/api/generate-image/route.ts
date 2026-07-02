import { NextResponse } from "next/server";

export const maxDuration = 10;

const GLM_IMAGE_ENDPOINT =
  "https://open.bigmodel.cn/api/paas/v4/images/generations";
// CogView-3-Plus typically takes 6-8s. 8.5s timeout leaves 1.5s buffer
// for Vercel's 10s function limit.
const TIMEOUT_MS = 8_500;

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

  const glmKey = process.env.GLM_API_KEY;
  if (!glmKey) {
    return NextResponse.json({ src: null, provider: "none" });
  }

  // Single GLM attempt — no model loop, no OpenAI fallback.
  // Both waste precious seconds and cause Vercel timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(GLM_IMAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${glmKey.trim()}`,
      },
      body: JSON.stringify({
        model: "cogview-3-plus",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[generate-image] GLM ${res.status}: ${text.slice(0, 300)}`,
      );
      return NextResponse.json({ src: null, provider: "none" });
    }

    const data = await res.json();
    const imgUrl: string | undefined = data?.data?.[0]?.url;

    if (!imgUrl) {
      console.error(
        "[generate-image] No URL in response:",
        JSON.stringify(data).slice(0, 200),
      );
      return NextResponse.json({ src: null, provider: "none" });
    }

    console.log("[generate-image] GLM succeeded");
    return NextResponse.json({ src: imgUrl, provider: "glm" });
  } catch (err) {
    clearTimeout(timer);
    console.error(
      "[generate-image] Failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ src: null, provider: "none" });
  }
}
