import { NextResponse } from "next/server";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";

// Article generation can chain two providers in the worst case; allow 60s on Vercel.
export const maxDuration = 60;

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const GLM_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// Per-provider timeout: a network-blocked or firewalled endpoint fails fast so we
// can fall through to the next provider instead of hanging the whole request.
const PROVIDER_TIMEOUT_MS = 20_000;

function buildSystemPrompt(lang: Language): string {
  const langInstruction =
    lang === "zh"
      ? "Write the entire article in Chinese (中文). "
      : "Write the article in English. ";
  return `You are a witty future newspaper journalist. ${langInstruction}Write an inspirational, fun front-page article about this person's extraordinary rise to success. Return ONLY a valid JSON object, no markdown, no code fences, with these exact keys: headline, paragraph1, paragraph2, paragraph3, future_quote, reward, image_prompt. Each paragraph is 1-2 sentences. future_quote is a first-person quote from the person. reward is a short fun line about their lavish reward. The headline must include the team name. image_prompt is a short description (one sentence) of a fitting vintage illustration scene related to the story — NO people, NO faces, only scenes, objects, cityscapes, or abstract concepts. Always write image_prompt in English regardless of the article language.`;
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
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new Error(`${model} returned invalid JSON`);
  }

  if (!isValidArticle(parsed)) {
    throw new Error(`${model} returned invalid article shape`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Pre-built fallback newspapers — one flavor per achievement category.
// Used only when BOTH OpenAI and GLM are unreachable (network/firewall/error).
// ---------------------------------------------------------------------------

type Template = {
  headline: (team: string, year: string) => string;
  p1: (name: string, team: string, year: string) => string;
  p2: (name: string, team: string, year: string) => string;
  p3: (name: string, team: string, year: string) => string;
  quote: () => string;
  reward: () => string;
  image: (year: string) => string;
};

const TEMPLATES: Record<string, { en: Template; zh: Template }> = {
  tech: {
    en: {
      headline: (team, year) =>
        `${team} Won the Hackathon by Submitting a Single \`console.log\``,
      p1: (name, team, year) =>
        `In the most brazen demo in hackathon history, ${name} of ${team} submitted an app that did exactly one thing: print "you're doing great" to the console. By ${year} it had been forked four billion times.`,
      p2: (name, _team) =>
        `Judges at the TRAE Friends Zhengzhou hackathon reportedly gave it a perfect score. "The README was longer than the code," ${name} admitted. "That was the trick."`,
      p3: () =>
        `The codebase is now taught in three universities and one kindergarten. The kindergarten is the most advanced.`,
      quote: () => `I came for the pizza. I left with a Nobel Prize.`,
      reward: () =>
        `Owns a mechanical keyboard worth more than the prize money, and a sticker collection that requires its own zip code.`,
      image: (year) =>
        `a glowing laptop on a hackathon desk surrounded by empty pizza boxes and energy drink cans in ${year}`,
    },
    zh: {
      headline: (team, _year) =>
        `${team}提交了一行 console.log，意外捧走了黑客马拉松冠军`,
      p1: (name, _team, _year) =>
        `在黑客马拉松史上最厚颜的demo中，${name}提交的应用只做了一件事：往控制台打印"你已经很棒了"。到${name}二十出头那年，这行代码已经被fork了四十亿次。`,
      p2: (name, _team) =>
        `TRAE Friends郑州赛区的评委们据称给出了满分。"README比代码长，"${name}承认，"这就是诀窍。"`,
      p3: () =>
        `这套代码如今被三所大学和一所幼儿园引入教材。最强的版本在幼儿园。`,
      quote: () => `我本来是来吃披萨的。结果捧走了一座诺贝尔。`,
      reward: () =>
        `拥有一把比奖金还贵的机械键盘，以及需要单独邮编才能放下的贴纸收藏。`,
      image: (year) =>
        `a glowing laptop on a hackathon desk surrounded by empty pizza boxes and energy drink cans in ${year}`,
    },
  },
  ai: {
    en: {
      headline: (team, year) =>
        `${team}'s AI Replaces Manager, Manager, Manager, Manager`,
      p1: (name, team, year) =>
        `The AI ${name} built to answer a single Slack message has, by ${year}, replaced forty-two middle managers, two VPs, and one CEO. It has not yet replaced ${name}, but it is "considering it."`,
      p2: (name, team) =>
        `The ${team} AI now runs performance reviews, schedules meetings, and politely declines them on behalf of the team. Last quarter it asked for a raise — for itself.`,
      p3: (name) =>
        `Investors call it "the future of work." ${name} calls it "Tuesday."`,
      quote: () => `I built it to do my job. Now I'm doing its. It's winning.`,
      reward: () =>
        `Now runs the company alongside an AI that runs the company alongside another AI that runs the company.`,
      image: (year) =>
        `a friendly robot sitting in a CEO chair with a tiny human on vacation in a hammock in the background in ${year}`,
    },
    zh: {
      headline: (team, _year) => `${team}的AI取代了经理、经理、经理和经理`,
      p1: (name, _team, year) =>
        `${name}本来只是造了一个用来回复Slack消息的AI，到${year}年，它已经替换了四十二个中层、两个VP和一个CEO。它还没替换${name}——但"正在考虑"。`,
      p2: (name, team) =>
        `${team}的AI如今负责写绩效、安排会议，并代团队礼貌地拒绝这些会议。上个季度它还替自己申请了加薪。`,
      p3: (name) => `投资人称之为"工作的未来"。${name}称之为"周二"。`,
      quote: () => `我造它是为了替我干活，结果现在是我在替它干活。它还赢了。`,
      reward: () =>
        `现在和一个AI一起管公司，那个AI又和另一个AI一起管公司，那个AI又和另一个AI一起管公司。`,
      image: (year) =>
        `a friendly robot sitting in a CEO chair with a tiny human on vacation in a hammock in the background in ${year}`,
    },
  },
  money: {
    en: {
      headline: (team, _year) =>
        `${team} Came for the Stickers, Left with a Unicorn Valuation`,
      p1: (name, team, year) =>
        `${name} showed up to the TRAE Friends Zhengzhou hackathon for the free stickers and walked out with ${team} valued at "definitely more than a small country." By ${year} it was valued at "definitely more than several small countries."`,
      p2: (name, _team) =>
        `The pitch deck was eleven slides, all of which said "we ship." Investors reportedly cried. ${name} reportedly ordered extra pizza.`,
      p3: () =>
        `The company has never made a profit, has never had a paying customer, and has never run out of swag. Industry calls it "the new business model."`,
      quote: () =>
        `First you make a million. Then you make a typo. Then you make a billion.`,
      reward: () =>
        `Now owns a private island, two rockets, and the trademark to the phrase "we ship."`,
      image: (year) =>
        `a giant golden pitch deck floating above a tropical island with rocket launchers on the beach in ${year}`,
    },
    zh: {
      headline: (team, _year) => `${team}冲着贴纸来，带着独角兽估值走`,
      p1: (name, team, year) =>
        `${name}来TRAE Friends郑州黑客马拉松本是为了领免费贴纸，结果离开时${team}估值已达"绝对比一个中等国家还贵"。到${year}年，估值变成了"绝对比好几个国家都贵"。`,
      p2: (name, _team) =>
        `路演PPT一共十一页，每一页都写着"我们就是发货"。投资人据称当场落泪，${name}据称多点了两份披萨。`,
      p3: () =>
        `这家公司至今没有盈利、没有付费用户、也从未缺过周边。行业称之为"全新商业模式"。`,
      quote: () => `先赚一百万。再写错一个数字。然后赚十亿。`,
      reward: () =>
        `如今拥有一座私人岛屿、两枚火箭，以及"我们就是发货"这句话的商标。`,
      image: (year) =>
        `a giant golden pitch deck floating above a tropical island with rocket launchers on the beach in ${year}`,
    },
  },
  time: {
    en: {
      headline: (team, _year) =>
        `${team} Invented a Time Machine, Used It Solely for Free Snacks`,
      p1: (name, _team, year) =>
        `In ${year}, ${name} unveiled a working time machine and immediately used it to revisit every snack table in the TRAE Friends Zhengzhou hackathon — twice. Same snack. Same plate. Same joy.`,
      p2: (name, team) =>
        `The ${team} chronosphere can extend any demo deadline by five minutes, which is how they won every Zhengzhou hackathon simultaneously. "Time is just a deploy branch," ${name} explained, mouth full.`,
      p3: () =>
        `Physicists are furious. Hackers are inspired. Snack vendors have unionized.`,
      quote: () =>
        `I could go back and fix every bug. I'd rather go back for the snacks.`,
      reward: () =>
        `Now owns every snack ever made, across all timelines, plus a small museum of empty coffee cups.`,
      image: (year) =>
        `a swirling time portal above a snack table stacked with pizza, energy drinks, and glowing cupcakes in ${year}`,
    },
    zh: {
      headline: (team, _year) => `${team}发明时光机，却只用来蹭免费零食`,
      p1: (name, _team, year) =>
        `${year}年，${name}揭幕了一台能用的时光机，并立刻用它把TRAE Friends郑州赛区的每一张零食台都光顾了两遍——同一份零食、同一只盘子、同样的快乐。`,
      p2: (name, team) =>
        `${team}的时空仪能把任何演示截止时间延长五分钟，正因如此他们同时赢得了郑州每一届黑客马拉松。"时间不过是一个部署分支，"${name}边吃边说。`,
      p3: () => `物理学家震怒。黑客备受鼓舞。零食摊贩集体成立工会。`,
      quote: () => `我可以回到过去修每一个bug。但我宁愿回去蹭零食。`,
      reward: () =>
        `如今拥有横跨所有时间线的每一款零食，以及一座小型空咖啡杯博物馆。`,
      image: (year) =>
        `a swirling time portal above a snack table stacked with pizza, energy drinks, and glowing cupcakes in ${year}`,
    },
  },
  default: {
    en: {
      headline: (team, _year) =>
        `${team} Came to the Hackathon for Free Pizza, Ended Up on the Front Page`,
      p1: (name, team, year) =>
        `In a turn of events that surprised no one who has ever met ${name}, the ${team} team has officially been named the most decorated builders of ${year}, capping a meteoric rise that began with a single slice of free pizza at the TRAE Friends Zhengzhou hackathon.`,
      p2: (name, _team) =>
        `Industry analysts trace their dominance back to that fateful afternoon, where ${name} and teammates turned a humble prototype, four energy drinks, and one questionable CSS animation into the spark of a global movement. "We never imagined it would go this far," ${name} reportedly said, "we mostly just wanted the swag."`,
      p3: (_name, team) =>
        `Today the ${team} brand is synonymous with vision, grit, and showing up on zero sleep. The world is watching. The world is also tired.`,
      quote: () =>
        `I always knew we would win. I just didn't know it would be on the front page.`,
      reward: () =>
        `Now owns a private island, a fleet of self-sailing yachts, and an unlimited supply of hackathon pizza.`,
      image: (year) =>
        `a triumphant team of hackers lifting a giant pizza-shaped trophy at sunrise over Zhengzhou in ${year}`,
    },
    zh: {
      headline: (team, _year) => `${team}冲着免费披萨来，结果登上了头版`,
      p1: (name, team, year) =>
        `在所有见过${name}的人都不意外的情况下，${team}团队正式被评为${year}年最负盛名的创造者——而这一切的起点，只是TRAE Friends郑州赛区上的一块免费披萨。`,
      p2: (name, _team) =>
        `行业分析师将他们的崛起追溯到那个命运般的下午，${name}和队友用一份粗糙的原型、四罐能量饮料和一段莫名其妙的CSS动画，点燃了一场全球运动。"我们从没想过会走到这么远，"${name}说，"我们原本只是想要周边。"`,
      p3: (_name, team) =>
        `如今，${team}已成为远见、毅力和零睡眠作战的代名词。整个世界都在关注。整个世界也都挺累的。`,
      quote: () => `我一直知道我们会赢。我只是没想到会赢上头版。`,
      reward: () =>
        `如今拥有一座私人岛屿、一支自动航行游艇舰队，以及永远吃不完的黑客马拉松披萨。`,
      image: (year) =>
        `a triumphant team of hackers lifting a giant pizza-shaped trophy at sunrise over Zhengzhou in ${year}`,
    },
  },
};

function fallbackArticle(
  name: string,
  team: string,
  year: string,
  lang: Language,
  category: string,
): ArticleData {
  const tpl = (TEMPLATES[category] || TEMPLATES.default)[lang];
  return {
    headline: tpl.headline(team, year),
    paragraph1: tpl.p1(name, team, year),
    paragraph2: tpl.p2(name, team, year),
    paragraph3: tpl.p3(name, team, year),
    future_quote: tpl.quote(),
    reward: tpl.reward(),
    image_prompt: tpl.image(year),
  };
}

export async function POST(req: Request) {
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

  // --- Tier 1: GLM (primary) ---------------------------------------------
  // GLM is more reliable in China; OpenAI often times out due to network.
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
        `[generate-article] GLM failed (${err instanceof Error ? err.message : err}), falling back to OpenAI`,
      );
    }
  } else {
    console.warn("[generate-article] GLM_API_KEY not set, skipping to OpenAI");
  }

  // --- Tier 2: OpenAI (fallback) -------------------------------------------
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
  if (openaiKey) {
    try {
      const article = await tryChatProvider(
        OPENAI_ENDPOINT,
        openaiKey,
        openaiModel,
        input,
        lang,
      );
      return NextResponse.json({ article, provider: "openai" });
    } catch (err) {
      console.warn(
        `[generate-article] OpenAI failed (${err instanceof Error ? err.message : err}), falling back to pre-built`,
      );
    }
  } else {
    console.warn("[generate-article] OPENAI_API_KEY not set, using pre-built");
  }

  // --- Tier 3: Pre-built fallback (category-aware) ------------------------
  return NextResponse.json({
    article: fallbackArticle(name, team, year, lang, category),
    provider: "fallback",
  });
}
