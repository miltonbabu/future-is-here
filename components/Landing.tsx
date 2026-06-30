"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface LandingProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onEnter: () => void;
}

export default function Landing({
  language,
  onLanguageChange,
  onEnter,
}: LandingProps) {
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/#form`);
    }
  }, []);

  const headlineFont =
    language === "zh" ? "font-headline-zh" : "font-landing-headline";
  const bodyFont = language === "zh" ? "font-body-zh" : "font-landing-body";
  const labelFont = bodyFont; // labels share body font

  return (
    <main
      className={`min-h-screen ${bodyFont} paper-grain`}
      data-year="near"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        {/* Top bar: tiny masthead + language toggle */}
        <div className="flex items-center justify-between mb-10">
          <p className={`landing-label text-[10px] sm:text-xs text-ink/70 ${labelFont}`}>
            {t(language, "timesLabel")}
          </p>
          <button
            type="button"
            onClick={() => onLanguageChange(language === "en" ? "zh" : "en")}
            className={`landing-label text-[10px] sm:text-xs border border-ink/40 hover:border-accent hover:text-accent px-2 py-1 transition-colors ${labelFont}`}
          >
            {t(language, "langToggle")}
          </button>
        </div>

        {/* Masthead */}
        <header className="text-center pb-6 masthead-rule">
          <p
            className={`landing-label text-[10px] sm:text-xs text-accent mb-2 ${labelFont}`}
          >
            {t(language, "landingEyebrow")}
          </p>
          <h1
            className={`${headlineFont} landing-headline text-5xl sm:text-7xl text-ink`}
          >
            {t(language, "masthead")}
          </h1>
          <p
            className={`landing-label text-[10px] sm:text-xs text-ink/70 mt-3 ${labelFont}`}
          >
            {t(language, "volInfo")} · {t(language, "price")}
          </p>
        </header>

        {/* Lead story */}
        <section className="py-8 sm:py-12">
          <h2
            className={`${headlineFont} landing-headline text-3xl sm:text-5xl text-center text-ink leading-[1.1] mb-6`}
          >
            {t(language, "landingHeadline")}
          </h2>
          <p
            className={`${bodyFont} text-ink/85 text-base sm:text-lg text-center max-w-2xl mx-auto leading-relaxed`}
          >
            {t(language, "landingBody")}
          </p>
        </section>

        <hr className="h-rule" />

        {/* QR + CTA — moved up, prominent */}
        <section className="py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-8">
            {/* QR Code */}
            <div className="text-center">
              <div className="border-2 border-ink p-2 bg-white">
                <QRCodeSVG
                  value={shareUrl || "https://future-time-capsule.vercel.app"}
                  size={150}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="M"
                />
              </div>
              <p className={`landing-label text-[10px] text-accent mt-2 ${labelFont}`}>
                {t(language, "landingQrText")}
              </p>
            </div>

            {/* CTA button */}
            <div className="text-center">
              <button
                type="button"
                onClick={onEnter}
                className={`${headlineFont} landing-headline text-2xl sm:text-3xl px-10 sm:px-14 py-4 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors`}
              >
                {t(language, "landingCta")}
              </button>
            </div>
          </div>

          {/* Bullets */}
          <ul className={`${bodyFont} text-ink/85 text-sm sm:text-base space-y-2 text-center max-w-lg mx-auto`}>
            <li className="flex gap-2 justify-center">
              <span className="text-accent font-bold">·</span>
              {t(language, "landingBullet1")}
            </li>
            <li className="flex gap-2 justify-center">
              <span className="text-accent font-bold">·</span>
              {t(language, "landingBullet2")}
            </li>
            <li className="flex gap-2 justify-center">
              <span className="text-accent font-bold">·</span>
              {t(language, "landingBullet3")}
            </li>
          </ul>
        </section>

        <hr className="h-rule" />

        {/* Footer */}
        <footer className="pt-4 text-center">
          <p className={`landing-label text-[10px] text-ink/60 ${labelFont}`}>
            {t(language, "landingFooter")}
          </p>
        </footer>
      </div>
    </main>
  );
}
