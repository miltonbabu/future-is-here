import type { ArticleData, Language } from "./types";

export interface SavedCapsule {
  id: string;
  createdAt: string;
  article: ArticleData;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: Language;
  shareUrl: string;
}

const STORAGE_KEY = "future-time-capsule-saved";

export function getAllCapsules(): SavedCapsule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedCapsule[];
  } catch {
    return [];
  }
}

export function getCapsule(id: string): SavedCapsule | null {
  return getAllCapsules().find((c) => c.id === id) ?? null;
}

export function saveCapsule(capsule: Omit<SavedCapsule, "id" | "createdAt">): SavedCapsule {
  const id = crypto.randomUUID();
  const entry: SavedCapsule = {
    ...capsule,
    id,
    createdAt: new Date().toISOString(),
  };
  const all = getAllCapsules();
  all.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  fetch("/api/capsules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...entry,
      article: JSON.stringify(entry.article),
    }),
  }).catch(() => {});

  return entry;
}

export function deleteCapsule(id: string): void {
  const all = getAllCapsules().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  fetch("/api/capsules", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => {});
}

export function clearAllCapsules(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function loadCapsulesFromDb(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/capsules");
    const dbCapsules = await res.json();
    if (Array.isArray(dbCapsules)) {
      const parsed: SavedCapsule[] = dbCapsules.map((c) => ({
        ...c,
        article: typeof c.article === "string" ? JSON.parse(c.article) : c.article,
        imageUrl: c.imageUrl || null,
        photoUrl: c.photoUrl || null,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // Failed to load from DB, keep localStorage as-is
  }
}
