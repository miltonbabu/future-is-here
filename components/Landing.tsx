"use client";

import { useState, useEffect } from "react";
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
  const headlineFont =
    language === "zh" ? "font-headline-zh" : "font-landing-headline";
  const bodyFont = language === "zh" ? "font-body-zh" : "font-landing-body";
  const labelFont = bodyFont; // labels share body font

  // Compute the QR target URL on the client only. Using `window.location.origin`
  // inline during render would produce a different value on the server (empty)
  // vs the client (full URL), causing a QRCodeSVG hydration mismatch.
  const [qrValue, setQrValue] = useState("/form");
  useEffect(() => {
    setQrValue(`${window.location.origin}/form`);
  }, []);

  return (
    <main
      className={`min-h-screen ${bodyFont} paper-grain`}
      data-year="near"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-10">
        {/* Top bar: tiny masthead + language toggle */}
        <div className="flex items-center justify-between mb-6">
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
        <header className="text-center pb-4 masthead-rule">
          <p
            className={`landing-label text-[10px] sm:text-xs text-accent mb-2 ${labelFont}`}
          >
            {t(language, "landingEyebrow")}
          </p>
          <h1
            className={`${headlineFont} landing-headline text-2xl xs:text-3xl sm:text-6xl text-ink leading-none`}
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
        <section className="py-4 sm:py-8">
          <h2
            className={`${headlineFont} landing-headline text-xl sm:text-4xl text-center text-ink leading-[1.1] mb-4`}
          >
            {t(language, "landingHeadline")}
          </h2>
          <p
            className={`${bodyFont} text-ink/85 text-sm sm:text-lg text-center max-w-2xl mx-auto leading-relaxed`}
          >
            {t(language, "landingBody")}
          </p>
        </section>

        <hr className="h-rule" />

        {/* QR + CTA — moved up, prominent */}
        <section className="py-4 sm:py-8">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10 mb-6">
            {/* QR Code */}
            <div className="text-center">
              <div className="border-2 border-ink p-2 bg-white">
                <QRCodeSVG
                  value={qrValue}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="L"
                  className="w-[100px] h-[100px] sm:w-[150px] sm:h-[150px]"
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
                className={`${headlineFont} landing-headline text-xl sm:text-3xl px-8 sm:px-14 py-3 sm:py-4 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors whitespace-nowrap`}
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
