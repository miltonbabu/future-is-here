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
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
}

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 11);
}

async function uploadToShareServer(
  data: SharedNewspaper,
): Promise<string | null> {
  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result.token || null;
  } catch {
    return null;
  }
}

async function fetchFromShareServer(
  token: string,
): Promise<SharedNewspaper | null> {
  try {
    const res = await fetch(`/api/share/${token}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function encode(data: SharedNewspaper): string {
  const json = JSON.stringify(data);
  const utf8 = encodeURIComponent(json);
  return btoa(utf8);
}

function decode(hash: string): SharedNewspaper | null {
  try {
    const utf8 = atob(hash);
    const json = decodeURIComponent(utf8);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function generateImageClientSide(prompt: string): Promise<string | null> {
  const glmKey = process.env.NEXT_PUBLIC_GLM_API_KEY;
  if (!glmKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(
      "https://open.bigmodel.cn/api/paas/v4/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${glmKey.trim()}`,
        },
        body: JSON.stringify({
          model: "cogview-3-plus",
          prompt,
          n: 1,
          size: "1024x1024",
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timer);

    if (!res.ok) {
      console.error(
        `[client-image] GLM ${res.status}:`,
        await res.text().catch(() => ""),
      );
      return null;
    }

    const data = await res.json();
    const imgUrl: string | undefined = data?.data?.[0]?.url;
    if (!imgUrl) {
      console.error("[client-image] No URL in response");
      return null;
    }

    console.log("[client-image] GLM succeeded");
    return imgUrl;
  } catch (err) {
    clearTimeout(timer);
    console.error(
      "[client-image] Failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
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
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decode(hash);
      if (decoded) {
        setArticle(decoded.article);
        setImageUrl(decoded.imageUrl);
        setPhotoUrl(decoded.photoUrl);
        setLastInput({
          name: decoded.name,
          team: decoded.team,
          achievement: decoded.article.headline,
          futureDate: decoded.futureDate,
          language: decoded.language,
          category: "default",
        });
        setLanguage(decoded.language);
        setView("result");
        return;
      }
    }

    const path = window.location.pathname;
    const match = path.match(/^\/share\/([a-zA-Z0-9]{9})$/);
    if (match) {
      fetchFromShareServer(match[1]).then((data) => {
        if (data) {
          setArticle(data.article);
          setImageUrl(data.imageUrl);
          setPhotoUrl(data.photoUrl);
          setLastInput({
            name: data.name,
            team: data.team,
            achievement: data.article.headline,
            futureDate: data.futureDate,
            language: data.language,
            category: "default",
          });
          setLanguage(data.language);
          setShareUrl(`${window.location.origin}/share/${match[1]}`);
          setView("result");
        }
      });
      return;
    }

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
        setErrorMsg(
          articleData.error ||
            `The press room had an issue (HTTP ${articleRes.status}). Please try again.`,
        );
        setView("form");
        return;
      }

      let resolvedImageUrl: string | null = null;
      try {
        const illustrationPrompt = `${articleData.article.image_prompt}, photorealistic, vintage newspaper photo, sepia tones, warm lighting, no people no faces`;
        resolvedImageUrl = await generateImageClientSide(illustrationPrompt);
      } catch {}

      setArticle(articleData.article);
      setImageUrl(resolvedImageUrl);

      const shared: SharedNewspaper = {
        article: { ...articleData.article, image_prompt: "" },
        imageUrl: resolvedImageUrl,
        photoUrl: photo,
        name: input.name,
        team: input.team,
        futureDate: input.futureDate,
        language: input.language,
      };

      let url = "";
      const token = await uploadToShareServer(shared);
      if (token) {
        url = `${window.location.origin}/share/${token}`;
      } else {
        const hash = encode(shared);
        url = `${window.location.origin}/#${hash}`;
      }

      window.history.replaceState(
        null,
        "",
        token ? `/share/${token}` : `/#${url}`,
      );
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
