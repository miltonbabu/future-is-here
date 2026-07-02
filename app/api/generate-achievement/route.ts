import { NextResponse } from "next/server";
import type { Language } from "@/lib/types";

export const maxDuration = 10;

const GLM_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const PROVIDER_TIMEOUT_MS = 8_000;

function buildSystemPrompt(lang: Language): string {
  const langInstruction =
    lang === "zh"
      ? "Write the entire response in Chinese (中文). "
      : "Write the entire response in English. ";
  return `${langInstruction}You are a witty hackathon participant coming up with absurd, funny future achievements. Generate 3 short, humorous achievement ideas based on the given category. Each achievement should be 1-2 sentences, funny, tech-themed, and about extraordinary future success. Return ONLY a valid JSON array of strings, no markdown, no code fences.`;
}

function buildUserPrompt(category: string, lang: Language): string {
  const categoryNames: Record<string, { en: string; zh: string }> = {
    tech: { en: "Tech & Coding", zh: "科技与编程" },
    ai: { en: "AI Mayhem", zh: "AI疯狂" },
    money: { en: "Money & Startups", zh: "金钱与创业" },
    time: { en: "Time & Chaos", zh: "时间与混乱" },
    all: { en: "General Tech/Hackathon", zh: "综合科技/黑客马拉松" },
  };
  const catName = categoryNames[category]?.[lang] || category;
  return `Generate 3 funny future achievements for the category: ${catName}. Make them absurd, tech-focused, and humorous.`;
}

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

async function tryGLM(
  category: string,
  lang: Language,
): Promise<string[] | null> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetchWithTimeout(
      GLM_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "glm-4-flash",
          messages: [
            { role: "system", content: buildSystemPrompt(lang) },
            { role: "user", content: buildUserPrompt(category, lang) },
          ],
          temperature: 1.0,
          response_format: { type: "json_object" },
        }),
      },
      PROVIDER_TIMEOUT_MS,
    );

    if (!res.ok) {
      console.error(`[generate-achievement] GLM ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    let parsed: unknown;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      console.error("[generate-achievement] Invalid JSON");
      return null;
    }

    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed as string[];
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, language } = body as {
      category: string;
      language: Language;
    };

    const aiAchievements = await tryGLM(category, language);
    if (aiAchievements && aiAchievements.length > 0) {
      return NextResponse.json({ achievements: aiAchievements });
    }

    return NextResponse.json({ achievements: null });
  } catch {
    return NextResponse.json({ achievements: null });
  }
}
