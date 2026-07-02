import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

// Vercel Hobby: 10s limit. Image download + Redis write should be ~3-5s.
export const maxDuration = 10;

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

// Upstash Redis client — only created when env vars are present (production).
// In local dev without Redis, we fall back to file-based JSON.
let redis: Redis | null = null;
try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch {
  // Redis not configured — use file fallback
}

function getShareDbPath(): string {
  const baseDir = process.env.NODE_ENV === "production" ? "/tmp" : process.cwd();
  return path.join(baseDir, ".data", "shares.json");
}

function ensureDir(): void {
  const dir = path.dirname(getShareDbPath());
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

function readShareDb(): Record<string, SharedNewspaper> {
  try {
    const content = fs.readFileSync(getShareDbPath(), "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeShareDb(data: Record<string, SharedNewspaper>): void {
  ensureDir();
  try {
    fs.writeFileSync(getShareDbPath(), JSON.stringify(data, null, 2));
  } catch {}
}

/**
 * Download an image URL and convert it to a base64 data URL.
 * This makes AI illustrations permanent — CogView URLs expire after hours/days,
 * but base64 data URLs live forever inside the stored share data.
 */
async function persistImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    // Reject oversized images (> 500KB) to avoid blowing past Redis/URL limits
    if (blob.size > 500_000) return null;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const contentType = blob.type || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body: SharedNewspaper = await req.json();

    // If the illustration is a remote URL (CogView), download it and convert
    // to base64 so it never expires. The user photo is already base64.
    let persistentImageUrl = body.imageUrl;
    if (body.imageUrl && body.imageUrl.startsWith("http")) {
      const base64 = await persistImageAsBase64(body.imageUrl);
      if (base64) {
        persistentImageUrl = base64;
      }
    }

    const token = Math.random().toString(36).substring(2, 11);
    const payload: SharedNewspaper = { ...body, imageUrl: persistentImageUrl };

    if (redis) {
      // Production: store in Upstash Redis (persistent, shared across instances)
      await redis.set(`share:${token}`, JSON.stringify(payload), { ex: 60 * 60 * 24 * 30 }); // 30-day TTL
    } else {
      // Local dev: store in file-based JSON
      const db = readShareDb();
      db[token] = payload;
      writeShareDb(db);
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[api/share] POST failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET() {
  // Health check — individual tokens are read via /api/share/[token]
  return NextResponse.json({
    ok: true,
    storage: redis ? "redis" : "file",
  });
}
