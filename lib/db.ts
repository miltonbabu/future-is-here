import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "capsules.json");

export interface DbCapsule {
  id: string;
  createdAt: string;
  article: string;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: string;
  shareUrl: string;
}

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function readDb(): DbCapsule[] {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as DbCapsule[];
  } catch {
    return [];
  }
}

function writeDb(capsules: DbCapsule[]): void {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(capsules, null, 2));
}

export async function saveCapsuleToDb(capsule: {
  id: string;
  createdAt: string;
  article: string;
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: string;
  shareUrl: string;
}): Promise<void> {
  const capsules = readDb();
  const index = capsules.findIndex((c) => c.id === capsule.id);
  if (index >= 0) {
    capsules[index] = capsule as DbCapsule;
  } else {
    capsules.unshift(capsule as DbCapsule);
  }
  writeDb(capsules);
}

export async function getCapsuleFromDb(id: string): Promise<DbCapsule | null> {
  const capsules = readDb();
  return capsules.find((c) => c.id === id) || null;
}

export async function getAllCapsulesFromDb(): Promise<DbCapsule[]> {
  return readDb();
}

export async function deleteCapsuleFromDb(id: string): Promise<void> {
  const capsules = readDb().filter((c) => c.id !== id);
  writeDb(capsules);
}
