"use client";

import { useState, useEffect } from "react";
import Newspaper from "@/components/Newspaper";
import type { ArticleData, Language } from "@/lib/types";

interface SharedNewspaper {
  article: ArticleData;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
}

function decodeHash(hash: string): SharedNewspaper | null {
  try {
    const utf8 = atob(hash);
    const json = decodeURIComponent(utf8);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SharedNewspaper | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    // 1) Try the self-contained URL hash first — no server lookup needed
    const hash = window.location.hash.slice(1);
    if (hash) {
      const decoded = decodeHash(hash);
      if (decoded) {
        setData(decoded);
        setLanguage(decoded.language || "en");
        setLoading(false);
        return;
      }
    }

    // 2) Fallback: fetch from the API (backward compatibility / Redis)
    fetch(`/api/share/${params.token}`)
      .then((res) => res.json())
      .then((result) => {
        if (result && result.article) {
          setData(result);
          setLanguage(result.language || "en");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center font-landing-headline text-2xl text-ink">
          Loading your future...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center font-landing-headline text-2xl text-ink">
          This newspaper has been lost to time.
        </div>
      </div>
    );
  }

  return (
    <Newspaper
      article={data.article}
      imageUrl={data.imageUrl}
      photoUrl={data.photoUrl}
      name={data.name}
      team={data.team}
      futureDate={data.futureDate}
      language={language}
      shareUrl={`${window.location.origin}/share/${params.token}`}
      onReset={() => (window.location.href = "/")}
    />
  );
}
