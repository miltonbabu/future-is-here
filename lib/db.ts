import fs from "fs";
import path from "path";

// Vercel serverless has a read-only filesystem except for /tmp.
// Use /tmp in production (Vercel), .data locally.
const DB_DIR =
  process.env.NODE_ENV === "production"
    ? "/tmp/.data"
    : path.join(process.cwd(), ".data");
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
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem — can't create dir, storage disabled
  }
}

function readDb(): DbCapsule[] {
  ensureDir();
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as DbCapsule[];
  } catch {
    return [];
  }
}

function writeDb(capsules: DbCapsule[]): boolean {
  ensureDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(capsules, null, 2));
    return true;
  } catch {
    // Read-only filesystem (Vercel) — storage disabled, app still works via localStorage
    return false;
  }
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
}): Promise<boolean> {
  const capsules = readDb();
  const index = capsules.findIndex((c) => c.id === capsule.id);
  if (index >= 0) {
    capsules[index] = capsule as DbCapsule;
  } else {
    capsules.unshift(capsule as DbCapsule);
  }
  return writeDb(capsules);
}

export async function getCapsuleFromDb(id: string): Promise<DbCapsule | null> {
  const capsules = readDb();
  return capsules.find((c) => c.id === id) || null;
}

export async function getAllCapsulesFromDb(): Promise<DbCapsule[]> {
  return readDb();
}

export async function deleteCapsuleFromDb(id: string): Promise<boolean> {
  const capsules = readDb().filter((c) => c.id !== id);
  return writeDb(capsules);
}
