import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import { checkRateLimit } from "@/lib/security";

// Rate limit: 30 reads per minute per IP (sharing page can get legit traffic)
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

// Tokens are 9-char alphanumeric from Math.random().toString(36).substring(2,11)
const TOKEN_RE = /^[a-z0-9]{9}$/;

// Upstash Redis client — mirrors the POST route's setup.
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

function readShareDb(): Record<string, unknown> {
  try {
    const content = fs.readFileSync(getShareDbPath(), "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

// Next.js 16: dynamic route params are now a Promise and must be awaited.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  // Rate limit
  const ip = getIp(_req);
  const { allowed } = checkRateLimit(
    `share:token:${ip}`,
    RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const { token } = await params;

    // Validate token format before using it in Redis keys / file lookups
    if (!TOKEN_RE.test(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (redis) {
      // Production: read from Upstash Redis
      const raw = await redis.get<string>(`share:${token}`);
      if (!raw) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      // Upstash may return the string directly or a parsed object
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      return NextResponse.json(data);
    } else {
      // Local dev: read from file-based JSON
      const db = readShareDb();
      const data = db[token];
      if (!data) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("[api/share/[token]] GET failed:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
