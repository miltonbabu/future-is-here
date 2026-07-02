"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CapsuleForm from "@/components/CapsuleForm";
import Newspaper from "@/components/Newspaper";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";
import { saveCapsule, getAllCapsules, type SavedCapsule } from "@/lib/storage";

interface SharedNewspaper {
  article: ArticleData;
  imageUrl: string | null;
  photoUrl: string | null;
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

    if (!res.ok) return null;

    const data = await res.json();
    const imgUrl: string | undefined = data?.data?.[0]?.url;
    return imgUrl || null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export default function FormPage() {
  const router = useRouter();
  const [view, setView] = useState<"form" | "loading" | "result" | "archive">(
    "form",
  );
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<CapsuleInput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [shareUrl, setShareUrl] = useState("");

  // Only restore from hash/share links — NOT from localStorage on refresh.
  // localStorage is only accessed when user clicks "All My Newspapers".
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
      fetch(`/api/share/${match[1]}`)
        .then((res) => res.json())
        .then((data: SharedNewspaper) => {
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
        })
        .catch(() => {});
      return;
    }
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
      try {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shared),
        });
        const result = await res.json();
        if (result.token) {
          url = `${window.location.origin}/share/${result.token}`;
        }
      } catch {}

      if (!url) {
        const hash = encode(shared);
        url = `${window.location.origin}/#${hash}`;
      }

      window.history.replaceState(
        null,
        "",
        url.includes("/share/") ? url : `/#${encode(shared)}`,
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
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", "/form");
    }
  };

  const openArchiveNewspaper = (cap: SavedCapsule) => {
    setArticle(cap.article);
    setImageUrl(cap.imageUrl);
    setPhotoUrl(cap.photoUrl);
    setLastInput({
      name: cap.name,
      team: cap.team,
      achievement: cap.article.headline,
      futureDate: cap.futureDate,
      language: cap.language,
      category: "default",
    });
    setLanguage(cap.language);
    setShareUrl(cap.shareUrl);
    setView("result");
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

  if (view === "archive") {
    return (
      <ArchiveView
        language={language}
        onBack={() => setView("form")}
        onOpen={openArchiveNewspaper}
      />
    );
  }

  return (
    <div className="relative">
      {/* Floating "All My Newspapers" button */}
      <button
        onClick={() => setView("archive")}
        className="fixed bottom-4 right-4 z-50 text-xs sm:text-sm border-2 border-ink bg-paper text-ink px-3 py-2 hover:bg-ink hover:text-paper transition-colors shadow-md"
      >
        {language === "zh" ? "我的报纸" : "My Newspapers"}
      </button>
      <CapsuleForm
        onGenerate={handleGenerate}
        onPhotoChange={setPhotoUrl}
        loading={view === "loading"}
        errorMsg={errorMsg}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
}

// ── Archive View ──────────────────────────────────────────────
function ArchiveView({
  language,
  onBack,
  onOpen,
}: {
  language: Language;
  onBack: () => void;
  onOpen: (cap: SavedCapsule) => void;
}) {
  const [capsules, setCapsules] = useState<SavedCapsule[]>([]);

  useEffect(() => {
    setCapsules(getAllCapsules());
  }, []);

  const handleDelete = (id: string) => {
    const updated = getAllCapsules().filter((c) => c.id !== id);
    localStorage.setItem("future-time-capsule-saved", JSON.stringify(updated));
    setCapsules(updated);
  };

  if (capsules.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 paper-grain">
        <div className="text-center">
          <p className="text-2xl font-headline text-ink mb-4">
            {language === "zh" ? "还没有报纸" : "No newspapers yet"}
          </p>
          <button
            onClick={onBack}
            className="border-2 border-ink px-6 py-2 hover:bg-ink hover:text-paper transition-colors"
          >
            {language === "zh" ? "← 返回" : "← Back"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 paper-grain">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-headline text-ink">
            {language === "zh" ? "我的报纸" : "My Newspapers"}
          </h1>
          <button
            onClick={onBack}
            className="text-sm border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
          >
            {language === "zh" ? "← 返回" : "← Back"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capsules.map((cap) => (
            <div
              key={cap.id}
              className="border-2 border-ink bg-paper p-3 hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              onClick={() => onOpen(cap)}
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] mb-2 overflow-hidden border border-ink/30 bg-[#f4ead5]">
                {cap.photoUrl ? (
                  <img
                    src={cap.photoUrl}
                    alt={cap.name}
                    className="w-full h-full object-cover"
                    style={{ filter: "sepia(50%) saturate(140%)" }}
                  />
                ) : cap.imageUrl ? (
                  <img
                    src={cap.imageUrl}
                    alt="illustration"
                    className="w-full h-full object-cover"
                    style={{ filter: "sepia(30%)" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30 text-xs">
                    {language === "zh" ? "无图片" : "No image"}
                  </div>
                )}
              </div>

              {/* Info */}
              <p className="font-headline text-sm font-bold text-ink line-clamp-2 mb-1">
                {cap.article.headline}
              </p>
              <p className="text-xs text-ink/70 mb-1">
                {cap.name} · {cap.team}
              </p>
              <p className="text-[10px] text-ink/50">{cap.futureDate}</p>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(cap.id);
                }}
                className="mt-2 text-[10px] text-red-700/70 hover:text-red-700 self-start"
              >
                {language === "zh" ? "删除" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
