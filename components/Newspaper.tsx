"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ArticleData, Language } from "@/lib/types";
import { t, formatDate } from "@/lib/i18n";

interface NewspaperProps {
  article: ArticleData;
  /** AI-generated illustration URL (data: URL or remote). null = generation failed, show text-only. */
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
  /** Shareable URL with newspaper data encoded in the hash. */
  shareUrl: string;
  onReset: () => void;
}

// Polaroid / CCD-style filter — strong warm cast, faded blacks, vintage look.
// Applied via CSS only; the image data is never transformed.
const PHOTO_FILTER =
  "sepia(50%) saturate(140%) contrast(100%) brightness(108%) hue-rotate(-8deg)";

// Warm sepia filter for the AI illustration — matches the newspaper palette.
const ILLUSTRATION_FILTER =
  "sepia(40%) contrast(92%) brightness(0.96) saturate(0.85)";

function yearBucket(year: number): "near" | "mid" | "far" {
  if (year <= 2030) return "near";
  if (year <= 2040) return "mid";
  return "far";
}

export default function Newspaper({
  article,
  imageUrl,
  photoUrl,
  name,
  team,
  futureDate,
  language,
  shareUrl,
  onReset,
}: NewspaperProps) {
  const dateInfo = formatDate(futureDate, language);
  const headlineFont = language === "zh" ? "font-headline-zh" : "font-headline";
  const bodyFont = language === "zh" ? "font-body-zh" : "font-body";
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  };

  const yearNum = Number(dateInfo.year) || 2032;
  const bucket = yearBucket(yearNum);

  return (
    <main
      className={`min-h-screen py-6 sm:py-10 px-3 sm:px-6 ${bodyFont} paper-grain`}
      data-year={bucket}
    >
      <article className="max-w-3xl mx-auto newspaper-paper border-2 border-ink p-5 sm:p-10">
        {/* Masthead eyebrow — "FRONT PAGE · A1" */}
        <div className="flex items-center justify-between text-ink/70 mb-2">
          <span className="h-label text-[9px] sm:text-[10px]">
            {language === "zh" ? "头版 · A1" : "Front Page · A1"}
          </span>
          <span className="h-label text-[9px] sm:text-[10px]">
            {dateInfo.long}
          </span>
        </div>

        {/* Masthead */}
        <header className="py-3 mb-6 text-center masthead-rule">
          <p className="h-label text-[9px] sm:text-xs text-ink/70 break-words">
            {t(language, "volInfo")} · {t(language, "price")}
          </p>
          <h2
            className={`h-headline ${headlineFont} text-5xl sm:text-7xl text-ink mt-1`}
          >
            {t(language, "masthead")}
          </h2>
        </header>

        {/* Photo + Headline */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6 items-start">
          {photoUrl && (
            <div className="sm:w-56 flex-shrink-0 flex sm:justify-start justify-center">
              <figure className="polaroid-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt={name}
                  className="block max-w-52 max-h-72 w-auto h-auto object-contain"
                  style={{ filter: PHOTO_FILTER }}
                />
                <figcaption className="text-center text-ink/80 text-xs italic h-body mt-3">
                  {name}
                </figcaption>
              </figure>
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1
              className={`h-headline ${headlineFont} text-3xl sm:text-5xl text-ink leading-[1.08]`}
            >
              {article.headline}
            </h1>
            <p className="h-label text-[10px] sm:text-xs text-accent mt-3">
              {t(language, "byline")}
            </p>
          </div>
        </div>

        {/* AI illustration — only rendered if image generation succeeded.
            If imageUrl is null (AI failed), this entire block is skipped and
            the newspaper shows text + uploaded photo only. */}
        {imageUrl && (
          <figure className="my-6">
            <div className="border border-ink p-1 overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="2032 scene illustration"
                className="w-full max-h-64 object-cover"
                style={{ filter: ILLUSTRATION_FILTER }}
              />
            </div>
            <figcaption className="h-label text-[10px] text-ink/50 text-center mt-1">
              {t(language, "illustrationCaption")}
            </figcaption>
          </figure>
        )}

        {/* Article body */}
        <div className="columns-1 md:columns-2 gap-8 col-rule text-[15px] leading-relaxed press-body text-ink/90">
          <p className="drop-cap mb-3">{article.paragraph1}</p>
          <p className="mb-3">{article.paragraph2}</p>
          <p className="mb-3">{article.paragraph3}</p>
        </div>

        {/* Pulled quote */}
        <hr className="h-rule my-6" />
        <blockquote className="py-6 text-center">
          <p
            className={`h-headline ${headlineFont} italic text-xl sm:text-2xl leading-snug text-ink`}
          >
            <span className="text-3xl mr-1 text-accent">&ldquo;</span>
            {article.future_quote}
            <span className="text-3xl ml-1 text-accent">&rdquo;</span>
          </p>
          <cite className="block text-xs not-italic text-ink/60 mt-2 italic">
            — {name}, {team}
          </cite>
        </blockquote>
        <hr className="h-rule my-2" />

        {/* Reward ribbon */}
        <div className="border-2 border-ink px-4 py-3 text-center my-8">
          <p className="h-label text-[10px] text-accent mb-1">
            {t(language, "statusUpdate")} · {dateInfo.year}
          </p>
          <p className={`h-headline ${headlineFont} text-lg text-ink`}>
            {article.reward}
          </p>
        </div>

        {/* Share / QR */}
        <div className="border-t-4 border-double border-ink pt-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="border-2 border-ink p-1 bg-white">
              <QRCodeSVG
                value={shareUrl || "https://future-time-capsule.vercel.app"}
                size={96}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
              />
            </div>
            <div>
              <p className={`h-headline ${headlineFont} text-sm text-ink`}>
                {t(language, "scanTitle")}
              </p>
              <p className="text-xs text-ink/70 max-w-[12rem] italic">
                {t(language, "scanDesc").replace("{year}", dateInfo.year)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={copyLink}
              className={`text-sm border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors ${bodyFont}`}
            >
              {copied ? t(language, "copied") : t(language, "copyLink")}
            </button>
            <button
              onClick={onReset}
              className={`h-headline ${headlineFont} text-sm border-2 border-ink bg-ink text-paper px-4 py-2 hover:bg-paper hover:text-ink transition-colors`}
            >
              {t(language, "createAnother")}
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}
