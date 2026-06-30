"use client";

import { useState, useEffect } from "react";
import Landing from "@/components/Landing";
import CapsuleForm from "@/components/CapsuleForm";
import Newspaper from "@/components/Newspaper";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";

type View = "landing" | "form" | "loading" | "result";

interface SharedNewspaper {
  article: ArticleData;
  imageUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
}

function encode(data: SharedNewspaper): string {
  const json = JSON.stringify(data);
  // Use btoa with UTF-8 safe encoding for the hash
  const utf8 = encodeURIComponent(json);
  return btoa(utf8);
}

function decode(hash: string): SharedNewspaper | null {
  try {
    const raw = atob(hash);
    const json = decodeURIComponent(raw);
    return JSON.parse(json) as SharedNewspaper;
  } catch {
    return null;
  }
}

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<CapsuleInput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [shareUrl, setShareUrl] = useState("");

  // On mount, check if the URL hash routes to a specific view:
  //   #form      → skip landing, go straight to the form
  //   #<base64>  → restore a shared newspaper and render it directly
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1); // remove leading #
    if (!hash) return;
    if (hash === "form") {
      setView("form");
      return;
    }
    const data = decode(hash);
    if (!data) return;
    setArticle(data.article);
    setImageUrl(data.imageUrl);
    setLastInput({
      name: data.name,
      team: data.team,
      achievement: "",
      futureDate: data.futureDate,
      language: data.language,
      category: "default",
    });
    setLanguage(data.language);
    setPhotoUrl(null); // photo can't be shared via URL
    setView("result");
  }, []);

  const handleGenerate = async (input: CapsuleInput, photo: string) => {
    setLastInput(input);
    setPhotoUrl(photo);
    setErrorMsg(null);
    setImageUrl(null);
    setView("loading");
    try {
      const articleRes = await fetch("/api/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const articleData = await articleRes.json();
      if (!articleRes.ok || !articleData.article) {
        setErrorMsg(articleData.error || "Something glitched in the time machine.");
        setView("form");
        return;
      }

      let resolvedImageUrl: string | null = null;
      try {
        const illustrationPrompt = `${articleData.article.image_prompt}, vintage engraving illustration, classic broadsheet editorial style, sepia tones, warm cream and brown ink palette, monochrome, no people, no faces`;
        const imageRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: illustrationPrompt }),
        });
        const imageData = await imageRes.json();
        if (imageRes.ok && imageData.src) {
          resolvedImageUrl = imageData.src;
        }
      } catch {
        // Image generation failed — proceed without illustration.
      }

      setArticle(articleData.article);
      setImageUrl(resolvedImageUrl);

      // Encode the newspaper into the URL hash so the share link opens
      // directly to this newspaper (not the homepage).
      // Strip image_prompt (only used for generation) and imageUrl (base64
      // data URLs are too large for URL hashes / QR codes).
      const shared: SharedNewspaper = {
        article: { ...articleData.article, image_prompt: "" },
        imageUrl: null,
        name: input.name,
        team: input.team,
        futureDate: input.futureDate,
        language: input.language,
      };
      const hash = encode(shared);
      const url = `${window.location.origin}/#${hash}`;
      window.history.replaceState(null, "", url);
      setShareUrl(url);

      setView("result");
    } catch {
      setErrorMsg("Something glitched in the time machine. Try again.");
      setView("form");
    }
  };

  const handleReset = () => {
    setArticle(null);
    setImageUrl(null);
    setPhotoUrl(null);
    setLastInput(null);
    setErrorMsg(null);
    setShareUrl("");
    window.history.replaceState(null, "", window.location.pathname);
    setView("form");
  };

  if (view === "result" && article && lastInput) {
    return (
      <Newspaper
        article={article}
        imageUrl={imageUrl}
        photoUrl={photoUrl}
        name={lastInput.name}
        team={lastInput.team}
        futureDate={lastInput.futureDate}
        language={language}
        shareUrl={shareUrl}
        onReset={handleReset}
      />
    );
  }

  if (view === "form" || view === "loading") {
    return (
      <CapsuleForm
        onGenerate={handleGenerate}
        onPhotoChange={setPhotoUrl}
        loading={view === "loading"}
        errorMsg={errorMsg}
        language={language}
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <Landing
      language={language}
      onLanguageChange={setLanguage}
      onEnter={() => setView("form")}
    />
  );
}