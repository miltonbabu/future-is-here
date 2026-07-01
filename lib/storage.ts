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
  return entry;
}

export function deleteCapsule(id: string): void {
  const all = getAllCapsules().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearAllCapsules(): void {
  localStorage.removeItem(STORAGE_KEY);
}