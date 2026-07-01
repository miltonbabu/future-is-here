"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CapsuleForm from "@/components/CapsuleForm";
import Newspaper from "@/components/Newspaper";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";
import { saveCapsule, getAllCapsules, loadCapsulesFromDb } from "@/lib/storage";

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

  useEffect(() => {
    const restoreFromStorage = async () => {
      await loadCapsulesFromDb();
      const capsules = getAllCapsules();
      if (capsules.length > 0) {
        const latest = capsules[0];
        setArticle(latest.article);
        setImageUrl(latest.imageUrl);
        setPhotoUrl(latest.photoUrl);
        setLastInput({
          name: latest.name,
          team: latest.team,
          achievement: latest.article.headline,
          futureDate: latest.futureDate,
          language: latest.language,
          category: "default",
        });
        setLanguage(latest.language);
        setShareUrl(latest.shareUrl);
        setView("result");
      }
    };
    restoreFromStorage();
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
        const year = input.futureDate?.split("-")[0] || "2032";
        const illustrationPrompt = `Photorealistic futuristic ${year} scene, ${articleData.article.image_prompt}, professional photography, high resolution, 8k, sharp focus, cinematic lighting, detailed textures, natural colors, vintage newspaper style photograph, warm sepia tones, aged paper texture overlay, documentary photography, no people, no faces, sci-fi elements, ultra realistic, photojournalism style`;
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
