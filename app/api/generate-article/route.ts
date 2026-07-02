import { NextResponse } from "next/server";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";

// Vercel Pro allows up to 60s for serverless functions. Hobby caps at 10s.
// Set to 60 — Vercel will enforce the actual limit based on your plan.
export const maxDuration = 60;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const GLM_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// On Vercel Pro: 50s gives GLM plenty of time to return a real article.
// Self-hosted: 30s is enough (no function limit).
// If on Vercel Hobby (10s cap), Vercel kills the function before this timeout
// — upgrade to Pro for longer generation time.
const PROVIDER_TIMEOUT_MS = process.env.VERCEL ? 50_000 : 30_000;

function buildSystemPrompt(lang: Language): string {
  const langInstruction =
    lang === "zh"
      ? "Write the entire article in Chinese (中文). "
      : "Write the article in English. ";
  return `You are a witty future newspaper journalist. ${langInstruction}Write an inspirational, fun front-page article about this person's extraordinary rise to success. The article MUST be directly based on the achievement described in the user's input — do NOT write a generic story about pizza, hackathons, or unrelated topics. Use the person's name, team name, and their specific achievement throughout the article. Return ONLY a valid JSON object, no markdown, no code fences, with these exact keys: headline, paragraph1, paragraph2, paragraph3, future_quote, reward, image_prompt. Each paragraph is 1-2 sentences. future_quote is a first-person quote from the person about their achievement. reward is a short fun line about their lavish reward. The headline must include the team name AND reflect the specific achievement. image_prompt must describe a scene that visually represents the SPECIFIC achievement (not generic hackathon/tech scenes) — NO people, NO faces, only scenes, objects, cityscapes, or abstract concepts related to the achievement. Always write image_prompt in English regardless of the article language.`;
}

function buildUserPrompt({
  name,
  team,
  achievement,
  futureDate,
}: CapsuleInput): string {
  const year = futureDate?.split("-")[0] || "2032";
  return `Name: ${name}. Team: ${team}. Achievement they're known for: ${achievement}. The newspaper is dated ${futureDate} (year ${year}). Write their ${year} success story as a front-page newspaper article set in ${year}.`;
}

function isValidArticle(obj: unknown): obj is ArticleData {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.headline === "string" &&
    typeof o.paragraph1 === "string" &&
    typeof o.paragraph2 === "string" &&
    typeof o.paragraph3 === "string" &&
    typeof o.future_quote === "string" &&
    typeof o.reward === "string" &&
    typeof o.image_prompt === "string"
  );
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

/**
 * Call an OpenAI-compatible chat-completions endpoint and return a parsed
 * ArticleData. Throws on any network/HTTP/parse failure so the caller can
 * fall through to the next provider.
 */
async function tryChatProvider(
  endpoint: string,
  apiKey: string,
  model: string,
  input: CapsuleInput,
  lang: Language,
): Promise<ArticleData> {
  const res = await fetchWithTimeout(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(lang) },
          { role: "user", content: buildUserPrompt(input) },
        ],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    },
    PROVIDER_TIMEOUT_MS,
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${model} responded ${res.status}: ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  let parsed: unknown;
  try {
    if (typeof content !== "string") {
      parsed = content;
    } else {
      // GLM-4-Flash often wraps JSON in markdown code fences or adds extra
      // text. Extract the first {...} block and parse that.
      const cleaned = content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Try to extract the first JSON object from the string
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("No JSON object found in response");
        }
      }
    }
  } catch {
    throw new Error(
      `${model} returned invalid JSON: ${String(content).slice(0, 200)}`,
    );
  }

  if (!isValidArticle(parsed)) {
    throw new Error(`${model} returned invalid article shape`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Dynamic fallback newspaper — builds a story from the ACTUAL achievement
// text the user entered, instead of hardcoded templates. Used only when GLM
// is unreachable (network/firewall/error).
// ---------------------------------------------------------------------------

function fallbackArticle(
  name: string,
  team: string,
  year: string,
  lang: string,
  _category: string,
  achievement: string,
): ArticleData {
  const safeLang: Language = lang === "zh" ? "zh" : "en";
  // Truncate achievement for headline use (keep it punchy)
  const shortAch =
    achievement.length > 60 ? achievement.slice(0, 57) + "..." : achievement;

  if (safeLang === "zh") {
    return {
      headline: `${team}传奇：${name}的${shortAch}`,
      paragraph1: `${year}年，${name}带领${team}团队震惊了整个行业。据报道，这一切始于"${achievement}"——一个当时看似不起眼、却改变了所有人看法的壮举。`,
      paragraph2: `"我们从没想过会走到这一步，"${name}在接受采访时说道。"当时只是想试一试，没想到一发不可收拾。"${team}的同事们纷纷表示，${name}的成功绝非偶然，而是远见与坚持的必然结果。`,
      paragraph3: `如今，${team}已成为行业标杆，而${name}的故事被写进了教科书，激励着无数后来者。业内专家评价："这是本世纪最具传奇色彩的崛起之一。"`,
      future_quote: `回过头看，那一步才是关键。感谢当初那个敢于尝试的自己。`,
      reward: `如今拥有一座私人岛屿、一支自动航行游艇舰队，以及"年度传奇人物"的终身称号。`,
      image_prompt: `a futuristic ${year} scene representing: ${achievement}, sci-fi cityscape, advanced technology, warm sepia tones, vintage newspaper photo style, no people no faces`,
    };
  }

  return {
    headline: `${team} Makes History: ${name}'s ${shortAch}`,
    paragraph1: `In ${year}, ${name} and the ${team} team shocked the world. It all started with one bold move: "${achievement}" — an achievement that seemed improbable at the time but would go on to redefine the industry.`,
    paragraph2: `"We never imagined it would go this far," ${name} said in an exclusive interview. "We just wanted to try something new." Colleagues at ${team} confirm that ${name}'s success was no accident — it was the product of relentless vision and determination.`,
    paragraph3: `Today, ${team} stands as an industry benchmark, and ${name}'s story has been written into textbooks, inspiring a new generation. Industry experts call it "one of the most legendary rises of the century."`,
    future_quote: `Looking back, that one step was the key. I'm grateful I had the courage to try.`,
    reward: `Now owns a private island, a fleet of self-sailing yachts, and the lifetime title of "Legend of the Year."`,
    image_prompt: `a futuristic ${year} scene representing: ${achievement}, sci-fi cityscape, advanced technology, warm sepia tones, vintage newspaper photo style, no people no faces`,
  };
}

export async function POST(req: Request) {
  try {
    let input: CapsuleInput;
    try {
      input = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { name, team, achievement } = input;
    if (!name || !team || !achievement) {
      return NextResponse.json(
        { error: "name, team and achievement are required" },
        { status: 400 },
      );
    }

    const year = input.futureDate?.split("-")[0] || "2032";
    const lang: Language = input.language || "en";
    const category = input.category || "default";

    // --- Tier 1: GLM (primary, 5s timeout) --------------------------------
    const glmKey = process.env.GLM_API_KEY;
    if (glmKey) {
      try {
        const article = await tryChatProvider(
          GLM_ENDPOINT,
          glmKey,
          "glm-4-flash",
          input,
          lang,
        );
        return NextResponse.json({ article, provider: "glm" });
      } catch (err) {
        console.warn(
          `[generate-article] GLM failed (${err instanceof Error ? err.message : err}), using pre-built fallback`,
        );
      }
    } else {
      console.warn(
        "[generate-article] GLM_API_KEY not set, using pre-built fallback",
      );
    }

    // --- Tier 2: Dynamic fallback (uses the actual achievement text) -----
    return NextResponse.json({
      article: fallbackArticle(name, team, year, lang, category, achievement),
      provider: "fallback",
    });
  } catch (err) {
    // Safety net — if anything unexpected throws, always return a response
    console.error("[generate-article] Unexpected error:", err);
    return NextResponse.json({
      article: fallbackArticle(
        "Friend",
        "Future",
        "2032",
        "en",
        "default",
        "an extraordinary achievement",
      ),
      provider: "fallback",
    });
  }
}
