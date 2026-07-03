"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import type { ArticleData, Language } from "@/lib/types";
import { t, formatDate } from "@/lib/i18n";

type ShareMode = "newspaper" | "moments" | "card";

interface NewspaperProps {
  article: ArticleData;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
  shareUrl: string;
  onReset: () => void;
}

const PHOTO_FILTER =
  "sepia(50%) saturate(140%) contrast(100%) brightness(108%) hue-rotate(-8deg)";

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
  const [downloading, setDownloading] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>("newspaper");
  const articleRef = useRef<HTMLElement>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const isMobile = () =>
    /iPhone|iPad|iPod|Android/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );

  const handleDownload = async () => {
    if (!articleRef.current) return;
    setDownloading(true);
    try {
      const wrapper = articleRef.current;

      // Find the actual rendered <article> element (not the wrapper div).
      const articleEl = wrapper.querySelector("article") as HTMLElement | null;
      if (!articleEl) {
        setDownloading(false);
        return;
      }

      // ── 1. Clone the article & strip problematic CSS ──
      //    We clone so we can aggressively strip CSS without visual flicker,
      //    and so the clone gets fresh computed styles in the document flow.
      const clone = articleEl.cloneNode(true) as HTMLElement;

      // Position offscreen but in document flow (required for computed styles)
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.zIndex = "-1";
      clone.style.width = articleEl.offsetWidth + "px";

      // Strip cross-origin background image + blend mode
      clone.style.backgroundImage = "none";
      clone.style.backgroundColor = "#f4ead5";
      clone.style.backgroundBlendMode = "normal";

      // Strip ::before / ::after pseudo content on clone children
      const allCloneEls = clone.querySelectorAll<HTMLElement>("*");
      for (const el of allCloneEls) {
        el.style.setProperty("--tw-content", "none");
      }

      // Force single column — foreignObject cannot render CSS columns
      const columnEls = clone.querySelectorAll<HTMLElement>(
        "[class*='columns-']",
      );
      for (const el of columnEls) {
        el.style.columnCount = "1";
        el.style.columnRule = "none";
        el.style.columnGap = "0";
      }

      // Remove drop-cap class (::first-letter pseudo-elements break in foreignObject)
      const dropCaps = clone.querySelectorAll<HTMLElement>(".drop-cap");
      for (const el of dropCaps) {
        el.classList.remove("drop-cap");
      }

      // Remove CSS transforms (rotate on polaroid frames can cause render issues)
      const polaroids = clone.querySelectorAll<HTMLElement>(".polaroid-frame");
      for (const el of polaroids) {
        el.style.transform = "none";
      }

      // Handle all images in clone: remove external filters and convert external sources
      const cloneImgs = clone.querySelectorAll<HTMLImageElement>("img");
      for (const img of cloneImgs) {
        // Keep filters for visual accuracy, but handle external URLs
        if (img.src.startsWith("http://") || img.src.startsWith("https://")) {
          try {
            const resp = await fetch(img.src);
            const imgBlob = await resp.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(imgBlob);
            });
            img.src = dataUrl;
          } catch {
            /* skip images that fail to fetch */
          }
        }
      }

      // Append clone to body so computed styles render correctly
      document.body.appendChild(clone);
      // Brief pause for layout + paint
      await new Promise((r) => setTimeout(r, 150));

      // ── 2. Capture the clone ──
      const pixelRatio = isMobile() ? 1 : 2;
      const dataUrl = await toPng(clone, {
        quality: 0.95,
        pixelRatio,
        backgroundColor: "#f4ead5",
        skipFonts: true,
        cacheBust: true,
      });

      // ── 3. Remove clone from DOM ──
      document.body.removeChild(clone);

      // ── 4. Download ──
      const blob = dataUrlToBlob(dataUrl);
      const filename = `future-times-${dateInfo.year}.png`;

      if (isMobile() && navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Future Times" });
        } else {
          const objectUrl = URL.createObjectURL(blob);
          window.open(objectUrl, "_blank");
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        }
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = objectUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      console.error("[download] failed:", err);
      alert(
        "Image download failed. Please take a screenshot instead, or try a different browser.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const yearNum = Number(dateInfo.year) || 2032;
  const bucket = yearBucket(yearNum);

  const modeButtons: { key: ShareMode; label: string }[] = [
    { key: "newspaper", label: t(language, "modeNewspaper") },
    { key: "moments", label: t(language, "modeMoments") },
    { key: "card", label: t(language, "modeCard") },
  ];

  return (
    <main
      className={`min-h-screen py-6 sm:py-10 px-3 sm:px-6 ${bodyFont} paper-grain`}
      data-year={bucket}
    >
      {/* ── Share mode selector ── */}
      <div className="max-w-3xl mx-auto mb-4 flex flex-col xs:flex-row items-start xs:items-center gap-2 flex-wrap">
        <span className="h-label text-[10px] sm:text-xs text-ink/70 flex-shrink-0">
          {t(language, "shareMode")}
        </span>
        <div className="flex border-2 border-ink overflow-hidden flex-shrink-0">
          {modeButtons.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setShareMode(key)}
              className={`text-[10px] xs:text-xs px-2 xs:px-3 py-1.5 transition-colors ${bodyFont} ${
                shareMode === key
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink hover:bg-ink/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rendered content area (captured for download) ── */}
      <div ref={articleRef as React.RefObject<HTMLDivElement>}>
        {shareMode === "newspaper" && (
          <article className="max-w-3xl mx-auto newspaper-paper border-2 border-ink p-4 sm:px-8 sm:py-10">
            <div className="flex items-center justify-between text-ink/70 mb-2">
              <span className="h-label text-[9px] sm:text-[10px]">
                {language === "zh" ? "头版 · A1" : "Front Page · A1"}
              </span>
              <span className="h-label text-[9px] sm:text-[10px]">
                {dateInfo.long}
              </span>
            </div>
            <header className="py-3 mb-6 text-center masthead-rule">
              <p className="h-label text-[9px] sm:text-xs text-ink/70 break-words">
                {t(language, "volInfo")} · {t(language, "price")}
              </p>
              <h2
                className={`h-headline ${headlineFont} text-3xl sm:text-6xl lg:text-7xl text-ink mt-1 leading-none`}
              >
                {t(language, "masthead")}
              </h2>
            </header>
            <div className="flex flex-col sm:flex-row gap-6 mb-6 items-start">
              {photoUrl && (
                <div className="sm:w-56 flex-shrink-0 flex sm:justify-start justify-center">
                  <figure className="polaroid-frame">
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
                  className={`h-headline ${headlineFont} text-2xl sm:text-4xl lg:text-5xl text-ink leading-[1.08]`}
                >
                  {article.headline}
                </h1>
                <p className="h-label text-[10px] sm:text-xs text-accent mt-3">
                  {t(language, "byline")}
                </p>
              </div>
            </div>
            {imageUrl && (
              <figure className="my-6">
                <div className="border border-ink p-1 overflow-hidden bg-[#f4ead5]">
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
            <div className="columns-1 md:columns-2 gap-8 col-rule text-[15px] leading-relaxed press-body text-ink/90">
              <p className="drop-cap mb-3">{article.paragraph1}</p>
              <p className="mb-3">{article.paragraph2}</p>
              <p className="mb-3">{article.paragraph3}</p>
            </div>
            <hr className="h-rule my-6" />
            <blockquote className="py-4 sm:py-6 text-center">
              <p
                className={`h-headline ${headlineFont} italic text-lg sm:text-2xl leading-snug text-ink`}
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
            <div className="border-2 border-ink px-4 py-3 text-center my-8">
              <p className="h-label text-[10px] text-accent mb-1">
                {t(language, "statusUpdate")} · {dateInfo.year}
              </p>
              <p className={`h-headline ${headlineFont} text-lg text-ink`}>
                {article.reward}
              </p>
            </div>
          </article>
        )}

        {shareMode === "moments" && (
          <article className="max-w-md mx-auto newspaper-paper border-2 border-ink p-4 sm:p-6">
            <header className="text-center masthead-rule pb-3 mb-4">
              <p className="h-label text-[9px] text-accent">
                {t(language, "landingEyebrow")}
              </p>
              <h2
                className={`h-headline ${headlineFont} text-2xl sm:text-4xl text-ink mt-1 leading-none`}
              >
                {t(language, "masthead")}
              </h2>
              <p className="h-label text-[9px] text-ink/60 mt-1">
                {dateInfo.long}
              </p>
            </header>
            <div className="flex gap-3 sm:gap-4 items-start mb-4">
              {photoUrl && (
                <div className="flex-shrink-0">
                  <div className="border border-ink p-0.5 bg-[#f4ead5]">
                    <img
                      src={photoUrl}
                      alt={name}
                      className="block w-16 h-16 sm:w-20 sm:h-20 object-cover"
                      style={{ filter: PHOTO_FILTER }}
                    />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className={`h-headline ${headlineFont} text-lg sm:text-2xl text-ink leading-tight`}
                >
                  {article.headline}
                </h3>
                <p className="h-label text-[9px] text-accent mt-1">
                  {name} · {team}
                </p>
              </div>
            </div>
            {imageUrl && (
              <div className="border border-ink p-0.5 bg-[#f4ead5] mb-4">
                <img
                  src={imageUrl}
                  alt="illustration"
                  className="w-full max-h-48 object-cover"
                  style={{ filter: ILLUSTRATION_FILTER }}
                />
              </div>
            )}
            <p className="text-sm text-ink/85 leading-relaxed press-body mb-3">
              {article.paragraph1}
            </p>
            <blockquote className="py-3 text-center border-t border-b border-ink/30 my-3">
              <p
                className={`h-headline ${headlineFont} italic text-base sm:text-lg text-ink`}
              >
                &ldquo;{article.future_quote}&rdquo;
              </p>
              <cite className="block text-[10px] not-italic text-ink/60 mt-1 italic">
                — {name}
              </cite>
            </blockquote>
            <div className="border-2 border-ink px-3 py-2 text-center mt-4">
              <p className="h-label text-[9px] text-accent">
                {t(language, "statusUpdate")} · {dateInfo.year}
              </p>
              <p
                className={`h-headline ${headlineFont} text-sm text-ink mt-0.5`}
              >
                {article.reward}
              </p>
            </div>
          </article>
        )}

        {shareMode === "card" && (
          <article className="max-w-sm mx-auto newspaper-paper border-2 border-ink p-4 sm:p-6 text-center">
            <header className="masthead-rule pb-3 mb-4">
              <p className="h-label text-[9px] text-accent">
                {t(language, "landingEyebrow")}
              </p>
              <h2
                className={`h-headline ${headlineFont} text-2xl sm:text-3xl text-ink mt-1 leading-none`}
              >
                {t(language, "masthead")}
              </h2>
            </header>
            {photoUrl && (
              <div className="flex justify-center mb-4">
                <div className="polaroid-frame">
                  <img
                    src={photoUrl}
                    alt={name}
                    className="block w-28 h-28 sm:w-36 sm:h-36 object-cover"
                    style={{ filter: PHOTO_FILTER }}
                  />
                  <figcaption className="text-center text-ink/80 text-xs italic h-body mt-2">
                    {name}
                  </figcaption>
                </div>
              </div>
            )}
            {imageUrl && (
              <div className="border border-ink p-0.5 bg-[#f4ead5] mb-4 mx-auto max-w-[240px]">
                <img
                  src={imageUrl}
                  alt="illustration"
                  className="w-full max-h-36 object-cover"
                  style={{ filter: ILLUSTRATION_FILTER }}
                />
              </div>
            )}
            <h3
              className={`h-headline ${headlineFont} text-xl sm:text-3xl text-ink leading-tight mb-3`}
            >
              {article.headline}
            </h3>
            <p className="h-label text-[10px] text-accent mb-4">
              {dateInfo.long} · {team}
            </p>
            <blockquote className="py-3 border-t border-b border-ink/30 my-3">
              <p
                className={`h-headline ${headlineFont} italic text-lg text-ink`}
              >
                &ldquo;{article.future_quote}&rdquo;
              </p>
            </blockquote>
            <div className="border-2 border-ink px-3 py-2 text-center mt-4">
              <p className="h-label text-[9px] text-accent">
                {t(language, "statusUpdate")} · {dateInfo.year}
              </p>
              <p
                className={`h-headline ${headlineFont} text-sm text-ink mt-0.5`}
              >
                {article.reward}
              </p>
            </div>
          </article>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="max-w-3xl mx-auto mt-4 px-2 sm:px-0">
        <div className="border-t-4 border-double border-ink pt-4 sm:pt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="border-2 border-ink p-1 bg-[#f4ead5] flex-shrink-0">
              <QRCodeSVG
                value={
                  shareUrl && shareUrl.length <= 300
                    ? shareUrl
                    : `${typeof window !== "undefined" ? window.location.origin : ""}`
                }
                size={80}
                bgColor="#f4ead5"
                fgColor="#1a1a1a"
                level="L"
                className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px]"
              />
            </div>
            <div>
              <p className={`h-headline ${headlineFont} text-xs sm:text-sm text-ink`}>
                {t(language, "scanTitle")}
              </p>
              <p className="text-[10px] sm:text-xs text-ink/70 max-w-[10rem] sm:max-w-[12rem] italic">
                {t(language, "scanDesc").replace("{year}", dateInfo.year)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`text-sm border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors ${bodyFont} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {downloading
                ? t(language, "downloading")
                : t(language, "downloadImage")}
            </button>
            <button
              onClick={copyLink}
              className={`text-sm border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors ${bodyFont}`}
            >
              {copied ? t(language, "copied") : t(language, "copyLink")}
            </button>
            <div className="flex gap-2">
              <button
                onClick={onReset}
                className={`flex-1 h-headline ${headlineFont} text-sm border-2 border-ink bg-ink text-paper px-4 py-2 hover:bg-paper hover:text-ink transition-colors`}
              >
                {t(language, "createAnother")}
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") window.location.href = "/";
                }}
                className={`text-sm border-2 border-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors ${bodyFont}`}
                title={language === "zh" ? "首页" : "Home"}
              >
                {language === "zh" ? "首页" : "Home"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
