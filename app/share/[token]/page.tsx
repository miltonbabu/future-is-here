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

export default function SharePage({
  params,
}: {
  params: { token: string };
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SharedNewspaper | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLanguage(result.language || "en");
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
