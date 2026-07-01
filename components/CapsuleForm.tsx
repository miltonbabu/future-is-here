"use client";

import { useState, useRef, useEffect } from "react";
import type { CapsuleInput, Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface CapsuleFormProps {
  onGenerate: (input: CapsuleInput, photoUrl: string) => void;
  onPhotoChange: (url: string | null) => void;
  loading: boolean;
  errorMsg: string | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const ACHIEVEMENT_CATEGORIES: {
  id: string;
  label: string;
  labelZh: string;
  items: string[];
  itemsZh: string[];
}[] = [
  {
    id: "tech",
    label: "Tech & Coding",
    labelZh: "科技与编程",
    items: [
      "Wrote a script that deploys straight to production on Fridays. Somehow, the company is still running in 2032.",
      "Introduced a bug that made everyone's screen display 'You're doing great!' They kept it as a morale-boosting feature.",
      "Deleted the bug tracker. Declared all existing issues 'features'. Became a legendary startup guru.",
      "Autocompleted a 10,000-line program by typing only the letter 'A'. The AI built the rest. Won a Nobel Prize in Programming.",
      "Used git push --force on the main branch. The universe didn't collapse. Now gives TED Talks on 'Fearless Coding'.",
      "Invented a coffee machine that also writes code",
      "Became the first hacker to debug code in their sleep",
      "Won three hackathons before breakfast",
      "Turned a bug into a feature and got promoted for it",
      "Wrote self-documenting code that documents itself",
      "Debugged production with a rubber duck and won",
    ],
    itemsZh: [
      "写了一个周五直接部署到生产环境的脚本。神奇的是，公司到2032年还在跑。",
      "不小心引入了一个bug，让所有人的屏幕都显示'你真的很棒！'，结果被当成提振士气的功能保留了下来。",
      "删掉了整个缺陷追踪器，把所有现存问题都宣布为'功能'。从此成为传奇创业导师。",
      "只敲了一个字母'A'，自动补全写完了一万行程序，AI补全了剩下的部分，荣获编程诺贝尔奖。",
      "在主分支上用了git push --force，宇宙没有坍缩。如今到处做'无畏编码'主题TED演讲。",
      "发明了一台既能煮咖啡又能写代码的咖啡机。",
      "成为史上第一个在睡梦中调试代码的黑客。",
      "早餐前就连赢三场黑客马拉松。",
      "把一个bug包装成feature，反而因此升了职。",
      "写出了能自我记录的代码。",
      "用一只橡皮鸭完成了生产环境调试，并大获全胜。",
    ],
  },
  {
    id: "ai",
    label: "AI Mayhem",
    labelZh: "AI疯狂",
    items: [
      "Built an AI that replied to my boss's emails. The AI got promoted. Now I work for my own creation.",
      "Trained an AI to write my performance reviews. The AI gave me a raise and promoted itself to my manager.",
      "Replaced all company meetings with a single AI spreadsheet. The spreadsheet quit after 3 weeks citing 'burnout'.",
      "Became the first person fired by an AI, then re-hired because the AI found the termination request 'too illogical'.",
      "Created an AI therapist. It diagnosed itself with anxiety and asked for a vacation.",
      "Trained a robot to give better demos than the CEO",
      "Created an app that turns meetings into naps",
      "Automated my job and nobody noticed for a year",
      "Built a neural network that only outputs compliments",
    ],
    itemsZh: [
      "造了一个AI替老板回邮件，结果AI先升了职，现在我反倒替自己造的东西打工。",
      "训练了一个AI替我写绩效评估，AI不仅给我加了薪，还把自己升成了我的上级。",
      "用一个AI表格取代了公司所有会议，结果表格干了三周就以'过劳'为由辞职了。",
      "成为史上第一个被AI开除的人，结果AI又以'裁员理由不合逻辑'为由把我请了回来。",
      "造了一个AI心理咨询师，它给自己诊断出焦虑症，还主动请了年假。",
      "训练了一台机器人，demo讲得比CEO还精彩。",
      "做了一个APP，能把会议一键变成午睡。",
      "把自己的工作全自动化了，整整一年没人发现。",
      "造了一个只会输出夸赞的神经网络。",
    ],
  },
  {
    id: "money",
    label: "Money & Startups",
    labelZh: "金钱与创业",
    items: [
      "Sold my startup for exactly 1 Bitcoin. That Bitcoin is now worth a small country's GDP. I lost the password.",
      "Inherited a million dollars, lost it on crypto meme coins, then built a new crypto called 'RefundCoin'. Became a billionaire again.",
      "Accidentally turned the CEO's portrait into a live meme generator. Got a corner office instead of getting fired.",
      "Started a company that delivers nothing but bad puns. Became a unicorn. No one knows how.",
      "Bought a private island using money saved from canceling 5 SaaS subscriptions.",
      "Built an AI that predicts lottery numbers (then forgot to use it)",
      "Shipped a startup in 48 hours and retired by Tuesday",
      "Scaled a side project to a million users by accident",
    ],
    itemsZh: [
      "把公司以整整一枚比特币的价格卖掉。那枚比特币如今值一个小国的GDP——我把密码忘了。",
      "继承了一百万美元，全赔在表情包币上，又造了个新币叫'退款币'，再度成为亿万富翁。",
      "不小心把CEO的肖像做成了实时表情包生成器，结果没被开除，反倒分到了角落办公室。",
      "开了一家只送烂梗的公司，居然成了独角兽，至今没人知道怎么做到的。",
      "靠取消5个SaaS订阅省下的钱，买了座私人小岛。",
      "造了一个能预测彩票号码的AI（然后忘了自己用它）。",
      "用48小时上线了一家创业公司，周二就退休了。",
      "一个副业项目不小心就做到了一百万用户。",
    ],
  },
  {
    id: "time",
    label: "Time & Chaos",
    labelZh: "时间与混乱",
    items: [
      "Invented a time machine but only uses it to go back 5 minutes for free snacks at events.",
      "Patented the 'IV Drip Coffee System' for continuous caffeine intake. The energy drink industry went bankrupt.",
      "Hacked the office coffee machine to print lottery tickets. Retired. Bought the coffee machine company.",
      "Built a robot to do my chores. The robot unionized. Now I do chores for the robot.",
      "Replaced my entire team with 3 lines of Python. The Python code asked for a bonus. I gave it one.",
      "Launched a rocket using only duct tape and JavaScript",
      "Built a time machine, mostly to extend hackathon deadlines",
    ],
    itemsZh: [
      "发明了一台时光机，却只用来倒回五分钟去蹭活动的免费零食。",
      "申请了'咖啡静脉滴注系统'专利，搞垮了整个能量饮料行业。",
      "黑进了办公室咖啡机，让它吐出彩票。退休之后，反手把咖啡机公司买了下来。",
      "造了一个做家务的机器人，结果机器人成立了工会——如今我反过来替机器人做家务。",
      "用三行Python替换掉了整个团队，结果这三行代码主动要求加薪——我照给了。",
      "只靠胶带和JavaScript就发射了一枚火箭。",
      "造了台时光机，主要是为了延长黑客马拉松的截止时间。",
    ],
  },
];

// Roast-tier, hackathon-flavored lines used when "All" is selected and the AI
// can't be reached. Mixed with the 4 category pools to make sure every random
// chip carries a punchline.
const ROAST_POOL_EN: string[] = [
  "Joined a hackathon for the free pizza. Won anyway. Hasn't stopped winning since.",
  "Submitted a project that's literally `console.log('hello world')`. Judge called it 'visionary.'",
  "Pitched the demo while the laptop was still rebooting. Got a perfect score on confidence.",
  "Replaced the entire backend with a screenshot of a backend. Nobody could tell.",
  "Used a CSS animation to hide that the app doesn't actually work. Won Best Design.",
  "Submitted a README longer than the codebase. Became a thought leader.",
  "Pair-programmed with a teammate who was asleep. Still shipped.",
  "Forgot to plug in the projector. Won anyway — talk was that good.",
  "Brought a mechanical keyboard worth more than the prize money. Won. The keyboard paid for itself.",
  "Submitted a project with 3 commits, all of them 'fix typo.' Won Best in Show.",
  "Lost Wi-Fi during the demo. Finished the pitch from memory. Got a standing ovation.",
  "Came for the stickers, stayed for the Nobel Prize.",
];

const ROAST_POOL_ZH: string[] = [
  "冲着免费披萨来参加黑客马拉松，结果意外拿了冠军，从此一路赢到底。",
  "交上去的项目其实就是一句 `console.log('hello world')`，评委称之为'富有远见'。",
  "笔记本还在重启就开始讲demo，靠自信拿了满分。",
  "用一张后端截图替换了真正的后端——没人发现。",
  "用CSS动画掩盖了应用其实跑不起来的真相，捧走了最佳设计。",
  "提交的README比代码还长，一不小心成了行业意见领袖。",
  "和一个睡着的队友结对编程，照样上线。",
  "忘了插投影仪，结果凭借口才照样拿奖。",
  "带来一把比奖金还贵的机械键盘，赢了——键盘一秒回本。",
  "项目一共三个commit，全是'修个错字'，拿下全场最佳。",
  "demo到一半Wi-Fi断了，靠记忆把演讲讲完，全场起立鼓掌。",
  "本是为了贴纸而来，结果捧走了诺贝尔奖。",
];

function getPool(categoryId: string, lang: "en" | "zh"): string[] {
  if (categoryId === "all") {
    const cats = ACHIEVEMENT_CATEGORIES.flatMap((c) =>
      lang === "zh" ? c.itemsZh : c.items,
    );
    const roast = lang === "zh" ? ROAST_POOL_ZH : ROAST_POOL_EN;
    return [...cats, ...roast];
  }
  const c = ACHIEVEMENT_CATEGORIES.find((c) => c.id === categoryId);
  if (!c) return [];
  return lang === "zh" ? c.itemsZh : c.items;
}

function rollChips(pool: string[]): string[] {
  const p = [...pool];
  const out: string[] = [];
  for (let i = 0; i < 3 && p.length; i++) {
    const idx = Math.floor(Math.random() * p.length);
    out.push(p.splice(idx, 1)[0]);
  }
  return out;
}

// Photo filter is inlined on the <img> for clarity. See Newspaper.tsx for the
// same constant — kept here as a comment to explain the absence of a const.

export default function CapsuleForm({
  onGenerate,
  onPhotoChange,
  loading,
  errorMsg,
  language,
  onLanguageChange,
}: CapsuleFormProps) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [achievement, setAchievement] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to data URL (base64) instead of blob URL — data URLs are plain
    // strings that survive view transitions, re-renders, and don't need
    // revocation. Blob URLs can be unreliable in production.
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoUrl(dataUrl);
      onPhotoChange(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const [chips, setChips] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [futureDate, setFutureDate] = useState("2032-07-01");

  // Populate chips on the client only — rollChips() uses Math.random(), which
  // would produce different output on the server vs client and trigger a
  // hydration mismatch.
  useEffect(() => {
    setChips(rollChips(getPool("all", language)));
    const pool = getPool(activeCategory, language);
    if (pool.length) {
      setAchievement(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [language]);

  const surpriseMe = () => {
    const pool = getPool(activeCategory, language);
    if (pool.length) {
      setAchievement(pool[Math.floor(Math.random() * pool.length)]);
    }
    setChips(rollChips(pool));
  };

  const selectCategory = (id: string) => {
    setActiveCategory(id);
    setChips(rollChips(getPool(id, language)));
  };

  const canSubmit =
    name.trim() && team.trim() && achievement.trim() && photoUrl && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !photoUrl) return;
    onGenerate(
      {
        name: name.trim(),
        team: team.trim(),
        achievement: achievement.trim(),
        futureDate,
        language,
        category: activeCategory,
      },
      photoUrl,
    );
  };

  const headlineFont = language === "zh" ? "font-headline-zh" : "font-headline";
  const bodyFont = language === "zh" ? "font-body-zh" : "font-body";
  const catLabel = (c: { label: string; labelZh: string }) =>
    language === "zh" ? c.labelZh : c.label;

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 ${bodyFont} paper-grain`}
    >
      <div className="w-full max-w-xl bg-paper border-2 border-ink p-6 sm:p-10">
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => onLanguageChange(language === "en" ? "zh" : "en")}
            className="h-label text-[10px] sm:text-xs border border-ink/40 hover:border-accent hover:text-accent px-2 py-1 transition-colors"
          >
            {t(language, "langToggle")}
          </button>
          <p className="h-label text-[10px] sm:text-xs text-ink/70">
            {t(language, "timesLabel")}
          </p>
        </div>

        <header className="text-center mb-6 masthead-rule pb-4">
          <p className="h-label text-[10px] sm:text-xs text-accent mb-2">
            {t(language, "volInfo")} · {t(language, "price")}
          </p>
          <h1
            className={`h-headline ${headlineFont} text-4xl sm:text-5xl text-ink tracking-tight leading-[1.05]`}
          >
            {t(language, "title")}
          </h1>
          <p className={`h-body ${bodyFont} text-sm text-ink/70 mt-3 italic`}>
            {t(language, "subtitle")}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block h-label text-[10px] sm:text-xs text-ink/70 mb-1">
              {t(language, "nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className={`w-full ${bodyFont} bg-transparent border-b-2 border-ink/30 focus:border-accent outline-none py-2 text-lg text-ink`}
              placeholder={t(language, "namePlaceholder")}
            />
          </div>

          <div>
            <label className="block h-label text-[10px] sm:text-xs text-ink/70 mb-1">
              {t(language, "teamLabel")}
            </label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              maxLength={60}
              className={`w-full ${bodyFont} bg-transparent border-b-2 border-ink/30 focus:border-accent outline-none py-2 text-lg text-ink`}
              placeholder={t(language, "teamPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block h-label text-[10px] sm:text-xs text-ink/70 mb-1">
                {t(language, "dateLabel")}
              </label>
              <input
                type="date"
                value={futureDate}
                onChange={(e) => setFutureDate(e.target.value)}
                className={`w-full ${bodyFont} bg-transparent border-b-2 border-ink/30 focus:border-accent outline-none py-2 text-lg text-ink`}
              />
            </div>
            <div className="flex items-end">
              <p
                className={`h-body ${bodyFont} text-xs text-ink/60 pb-3 italic`}
              >
                {t(language, "dateHint")}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block h-label text-[10px] sm:text-xs text-ink/70">
                {t(language, "achievementLabel")}
              </label>
              <button
                type="button"
                onClick={surpriseMe}
                className={`h-label text-[10px] sm:text-xs flex items-center gap-1 border border-ink/40 hover:border-accent hover:text-accent px-2 py-1 transition-colors`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 3h5v5" />
                  <path d="M4 20 21 3" />
                  <path d="M21 16v5h-5" />
                  <path d="M15 15l6 6" />
                  <path d="M4 4l5 5" />
                </svg>
                {t(language, "surpriseMe")}
              </button>
            </div>
            <textarea
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              maxLength={240}
              rows={3}
              className={`w-full ${bodyFont} bg-paper border-2 border-ink/30 focus:border-accent outline-none p-3 text-base resize-none text-ink`}
              placeholder={t(language, "achievementPlaceholder")}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => selectCategory("all")}
                className={`${bodyFont} text-[11px] px-2 py-0.5 border transition-colors ${
                  activeCategory === "all"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/30 text-ink/80 hover:border-ink"
                }`}
              >
                {t(language, "all")}
              </button>
              {ACHIEVEMENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.id)}
                  className={`${bodyFont} text-[11px] px-2 py-0.5 border transition-colors ${
                    activeCategory === c.id
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/30 text-ink/80 hover:border-ink"
                  }`}
                >
                  {catLabel(c)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {chips.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAchievement(s)}
                  className={`${bodyFont} text-xs text-ink/80 border border-ink/30 hover:border-ink hover:bg-ink hover:text-paper transition-colors px-2 py-1 max-w-full truncate`}
                  title={s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block h-label text-[10px] sm:text-xs text-ink/70 mb-2">
              {t(language, "photoLabel")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`${bodyFont} text-sm border-2 border-ink/40 px-3 py-3 hover:border-ink hover:bg-ink hover:text-paper transition-colors flex flex-col items-center gap-1`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>{t(language, "takePhoto")}</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className={`${bodyFont} text-sm border-2 border-ink/40 px-3 py-3 hover:border-ink hover:bg-ink hover:text-paper transition-colors flex flex-col items-center gap-1`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{t(language, "gallery")}</span>
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              className="hidden"
            />
            {photoUrl && (
              <div className="mt-4 flex justify-center">
                <div className="polaroid-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Your preview"
                    className="block max-w-52 max-h-72 w-auto h-auto object-contain"
                    style={{
                      filter:
                        "sepia(50%) saturate(140%) contrast(100%) brightness(108%) hue-rotate(-8deg)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className={`${bodyFont} text-sm text-accent text-center italic`}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full ${headlineFont} h-headline text-xl py-3 border-2 border-ink bg-ink text-paper hover:bg-paper hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
          >
            {loading ? (
              <>
                <span className="press-spinner" />
                <span>{t(language, "printing")}</span>
              </>
            ) : (
              t(language, "generate")
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
