import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface SharedNewspaper {
  article: {
    headline: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    future_quote: string;
    reward: string;
    image_prompt: string;
  };
  imageUrl: string | null;
  photoUrl: string | null;
  name: string;
  team: string;
  futureDate: string;
  language: "en" | "zh";
}

function getShareDbPath(): string {
  const baseDir = process.env.NODE_ENV === "production" ? "/tmp" : process.cwd();
  return path.join(baseDir, ".data", "shares.json");
}

function ensureDir(): void {
  const dbPath = getShareDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
    }
  }
}

function readShareDb(): Record<string, SharedNewspaper> {
  const dbPath = getShareDbPath();
  try {
    const content = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeShareDb(data: Record<string, SharedNewspaper>): void {
  const dbPath = getShareDbPath();
  ensureDir();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch {
  }
}

export async function POST(req: Request) {
  try {
    const body: SharedNewspaper = await req.json();
    const token = Math.random().toString(36).substring(2, 11);

    const db = readShareDb();
    db[token] = body;
    writeShareDb(db);

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[api/share] POST failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } },
) {
  try {
    const token = params.token;
    const db = readShareDb();
    const data = db[token];

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/share] GET failed:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
