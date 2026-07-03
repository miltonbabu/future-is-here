import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import { checkRateLimit, isSafeUrl } from "@/lib/security";

// Vercel Hobby: 10s limit. Image download + Redis write should be ~3-5s.
export const maxDuration = 10;

// Rate limit: 20 share creations / 10 health checks per minute per IP
const POST_RATE_LIMIT = 20;
const GET_RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

// Max size for stored share data (prevents abuse)
const MAX_SHARE_ENTRIES = 500;
// Max base64 image size (1MB)
const MAX_IMAGE_BYTES = 1_000_000;

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

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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

/** Sanitize shared newspaper input — prevent oversized or malicious payloads */
function sanitizeArticleField(s: unknown): string {
  return (typeof s === "string" ? s : "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .slice(0, 500);
}

function validateSharedInput(raw: Record<string, unknown>): SharedNewspaper | null {
  // Validate article object
  const art = raw.article;
  if (typeof art !== "object" || art === null) return null;
  const a = art as Record<string, unknown>;

  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 60) : "";
  if (!name) return null;

  const team = typeof raw.team === "string" ? raw.team.trim().slice(0, 60) : "";
  if (!team) return null;

  const futureDate =
    typeof raw.futureDate === "string"
      ? raw.futureDate.trim().slice(0, 10)
      : "";
  if (futureDate && !/^\d{4}-\d{2}-\d{2}$/.test(futureDate)) return null;

  const language: "en" | "zh" =
    raw.language === "zh" ? "zh" : "en";

  // Sanitize image URLs
  const imageUrl =
    typeof raw.imageUrl === "string" && raw.imageUrl.length <= 500_000
      ? raw.imageUrl.slice(0, 500_000)
      : null;

  const photoUrl =
    typeof raw.photoUrl === "string" && raw.photoUrl.length <= 500_000
      ? raw.photoUrl.slice(0, 500_000)
      : null;

  return {
    article: {
      headline: sanitizeArticleField(a.headline),
      paragraph1: sanitizeArticleField(a.paragraph1),
      paragraph2: sanitizeArticleField(a.paragraph2),
      paragraph3: sanitizeArticleField(a.paragraph3),
      future_quote: sanitizeArticleField(a.future_quote),
      reward: sanitizeArticleField(a.reward),
      image_prompt: sanitizeArticleField(a.image_prompt),
    },
    imageUrl,
    photoUrl,
    name,
    team,
    futureDate,
    language,
  };
}

/**
 * Download an image URL and convert it to a base64 data URL.
 * Only downloads from validated external URLs (SSRF prevention).
 */
async function persistImageAsBase64(url: string): Promise<string | null> {
  // Validate URL before fetching to prevent SSRF
  if (!isSafeUrl(url)) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    // Reject oversized images to avoid blowing past Redis/URL limits
    if (blob.size > MAX_IMAGE_BYTES) return null;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const contentType = blob.type || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // Rate limit
  const ip = getIp(req);
  const { allowed } = checkRateLimit(
    `share:post:${ip}`,
    POST_RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Validate and sanitize input
    const body = validateSharedInput(raw as Record<string, unknown>);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid share data" },
        { status: 400 },
      );
    }

    // If the illustration is a remote URL (CogView), download it and convert
    // to base64 so it never expires. The user photo is already base64.
    let persistentImageUrl = body.imageUrl;
    if (
      body.imageUrl &&
      body.imageUrl.startsWith("http") &&
      body.imageUrl.length < 1_000
    ) {
      const base64 = await persistImageAsBase64(body.imageUrl);
      if (base64) {
        persistentImageUrl = base64;
      }
    }

    const token = Math.random().toString(36).substring(2, 11);
    const payload: SharedNewspaper = { ...body, imageUrl: persistentImageUrl };

    if (redis) {
      // Production: store in Upstash Redis (persistent, shared across instances)
      await redis.set(`share:${token}`, JSON.stringify(payload), {
        ex: 60 * 60 * 24 * 30, // 30-day TTL
      });
    } else {
      // Local dev: store in file-based JSON
      const db = readShareDb();
      // Enforce max entries to prevent abuse
      const keys = Object.keys(db);
      if (keys.length >= MAX_SHARE_ENTRIES) {
        // Remove oldest entries to make room
        const oldestKey = keys.sort()[0];
        delete db[oldestKey];
      }
      db[token] = payload;
      writeShareDb(db);
    }

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[api/share] POST failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Rate limit (mild — health check)
  const ip = getIp(req);
  const { allowed } = checkRateLimit(
    `share:get:${ip}`,
    GET_RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  // Health check — individual tokens are read via /api/share/[token]
  return NextResponse.json({
    ok: true,
    storage: redis ? "redis" : "file",
  });
}
