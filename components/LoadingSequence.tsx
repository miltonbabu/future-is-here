"use client";

import { useState, useEffect } from "react";
import type { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface LoadingStep {
  id: string;
  en: string;
  zh: string;
  icon: string;
  /** Delay before this step appears (ms) */
  delay: number;
}

const STEPS: LoadingStep[] = [
  {
    id: "dispatch",
    en: "Dispatching correspondents to the future…",
    zh: "派遣记者前往未来…",
    icon: "🛰️",
    delay: 300,
  },
  {
    id: "gather",
    en: "Gathering news from tomorrow's headlines…",
    zh: "从明日头条收集新闻…",
    icon: "📡",
    delay: 1800,
  },
  {
    id: "write",
    en: "Composing an epic front-page story…",
    zh: "撰写史诗级头版故事…",
    icon: "🖋️",
    delay: 3600,
  },
  {
    id: "illustrate",
    en: "Developing archival photograph…",
    zh: "冲印档案照片…",
    icon: "📷",
    delay: 5400,
  },
  {
    id: "typeset",
    en: "Setting movable type by hand…",
    zh: "手工排版活字印刷…",
    icon: "🔤",
    delay: 7000,
  },
  {
    id: "press",
    en: "Ink is drying on the broadsheet…",
    zh: "油墨正在干燥…",
    icon: "🗞️",
    delay: 8400,
  },
  {
    id: "finish",
    en: "Your future edition is almost ready!",
    zh: "您的未来版即将完成！",
    icon: "✨",
    delay: 9800,
  },
];

export default function LoadingSequence({
  language,
}: {
  language: Language;
}) {
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);

  useEffect(() => {
    // Reset on language change
    setVisibleSteps([]);

    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((step) => {
      const t = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step.id]);
      }, step.delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [language]);

  const bodyFont = language === "zh" ? "font-body-zh" : "font-body";
  const headlineFont =
    language === "zh" ? "font-headline-zh" : "font-headline";

  return (
    <main
      className={`min-h-screen flex items-center justify-center paper-grain ${bodyFont}`}
    >
      <div className="max-w-lg w-full mx-auto px-5 py-10 text-center">
        {/* Animated press icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-[3px] border-ink/20 rounded-full animate-[spin-ink_3s_linear_infinite]" />
            {/* Inner pulsing icon */}
            <div className="absolute inset-3 border-2 border-ink/40 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl sm:text-3xl animate-bounce">
                📰
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          className={`h-headline ${headlineFont} text-xl sm:text-2xl text-ink mb-8 tracking-wide`}
        >
          {t(language, "printing")}
        </h2>

        {/* Animated steps */}
        <div className="space-y-4 text-left max-w-xs sm:max-w-sm mx-auto">
          {STEPS.map((step) => {
            const visible = visibleSteps.includes(step.id);
            const isLast = step.id === STEPS[STEPS.length - 1].id;

            if (!visible && !isLast) return null;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 transition-all duration-700 ease-out ${
                  visible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                }`}
              >
                {/* Icon */}
                <span
                  className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border transition-colors duration-500 ${
                    visible
                      ? isLast
                        ? "border-accent bg-accent/10"
                        : "border-ink/30 bg-paper"
                      : "border-ink/10 bg-transparent"
                  }`}
                >
                  <span className="text-sm">{step.icon}</span>
                </span>

                {/* Text with typewriter effect */}
                <span
                  className={`text-sm sm:text-base transition-colors duration-500 ${
                    visible
                      ? isLast
                        ? "text-accent font-bold"
                        : "text-ink/80"
                      : "text-ink/0"
                  }`}
                  style={{
                    animation: visible
                      ? `fadeSlideIn 0.5s ease-out forwards`
                      : "none",
                  }}
                >
                  {language === "zh" ? step.zh : step.en}
                </span>
              </div>
            );
          })}

          {/* Graceful empty state while first step loads */}
          {visibleSteps.length === 0 && (
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full border border-ink/20 bg-paper flex-shrink-0 flex items-center justify-center">
                <span className="text-xs opacity-0">•</span>
              </span>
              <span className="h-4 bg-ink/10 rounded animate-pulse w-3/4" />
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-[10px] sm:text-xs text-ink/40 italic">
          {language === "zh"
            ? "AI正在为您生成独家内容，请稍候…"
            : "AI is generating your exclusive edition, please wait…"}
        </p>
      </div>

      {/* Inline keyframes — small, scoped */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </main>
  );
}
