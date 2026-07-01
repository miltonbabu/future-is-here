"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CapsuleForm from "@/components/CapsuleForm";
import Newspaper from "@/components/Newspaper";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";
import { saveCapsule } from "@/lib/storage";

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
  const utf8 = encodeURIComponent(json);
  return btoa(utf8);
}

export default function FormPage() {
  const router = useRouter();
  const [view, setView] = useState<"form" | "loading" | "result">("form");
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<CapsuleInput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [shareUrl, setShareUrl] = useState("");

  const handleGenerate = async (input: CapsuleInput, photo: string) => {
    setLastInput(input);
    setPhotoUrl(photo);
    setErrorMsg(null);
    setImageUrl(null);
    setView("loading");
    try {
      const [articleRes, imageRes] = await Promise.all([
        fetch("/api/generate-article", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${input.achievement}, vintage engraving illustration, classic broadsheet editorial style, sepia tones, warm cream and brown ink palette, monochrome, no people, no faces`,
          }),
        }),
      ]);

      const articleData = await articleRes.json();
      if (!articleRes.ok || !articleData.article) {
        setErrorMsg(articleData.error || "Something glitched in the time machine.");
        setView("form");
        return;
      }

      let resolvedImageUrl: string | null = null;
      try {
        const imageData = await imageRes.json();
        if (imageRes.ok && imageData.src) {
          resolvedImageUrl = imageData.src;
        }
      } catch {
        // Image generation failed — proceed without illustration.
      }

      setArticle(articleData.article);
      setImageUrl(resolvedImageUrl);

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

      saveCapsule({
        article: { ...articleData.article, image_prompt: "" },
        imageUrl: resolvedImageUrl,
        photoUrl: photo,
        name: input.name,
        team: input.team,
        futureDate: input.futureDate,
        language: input.language,
        shareUrl: url,
      });

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
