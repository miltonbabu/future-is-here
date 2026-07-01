"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Landing from "@/components/Landing";
import Newspaper from "@/components/Newspaper";
import type { ArticleData, CapsuleInput, Language } from "@/lib/types";

interface SharedNewspaper {
  article: ArticleData;
  imageUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
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
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");

  // Shared newspaper state — only used when arriving via #<base64> hash
  const [sharedData, setSharedData] = useState<SharedNewspaper | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    if (hash === "form") {
      router.replace("/form");
      return;
    }
    const data = decode(hash);
    if (data) {
      setSharedData(data);
      setLanguage(data.language);
    }
  }, [router]);

  if (sharedData) {
    return (
      <Newspaper
        article={sharedData.article}
        imageUrl={sharedData.imageUrl}
        photoUrl={null}
        name={sharedData.name}
        team={sharedData.team}
        futureDate={sharedData.futureDate}
        language={language}
        shareUrl={typeof window !== "undefined" ? window.location.href : ""}
        onReset={() => {
          setSharedData(null);
          router.push("/form");
        }}
      />
    );
  }

  return (
    <Landing
      language={language}
      onLanguageChange={setLanguage}
      onEnter={() => router.push("/form")}
    />
  );
}
