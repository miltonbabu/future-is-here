import { NextResponse } from "next/server";
import {
  getAllCapsulesFromDb,
  saveCapsuleToDb,
  deleteCapsuleFromDb,
} from "@/lib/db";
import { checkRateLimit } from "@/lib/security";

// Rate limit: 30 read / 15 write / 10 delete requests per minute per IP
const GET_RATE_LIMIT = 30;
const POST_RATE_LIMIT = 15;
const DELETE_RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

/** Valid UUID or alphanumeric ID with dashes — max 64 chars */
const ID_RE = /^[\w-]{1,64}$/;

function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateHeaders(remaining: number): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
  };
}

export async function GET(req: Request) {
  const ip = getIp(req);
  const { allowed, remaining } = checkRateLimit(
    `capsules:get:${ip}`,
    GET_RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateHeaders(0) },
    );
  }

  try {
    const capsules = await getAllCapsulesFromDb();
    return NextResponse.json(capsules, {
      headers: getRateHeaders(remaining),
    });
  } catch (err) {
    console.error("[api/capsules] GET failed:", err);
    return NextResponse.json([], {
      headers: getRateHeaders(remaining),
    });
  }
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const { allowed, remaining } = checkRateLimit(
    `capsules:post:${ip}`,
    POST_RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateHeaders(0) },
    );
  }

  try {
    const body = await req.json();

    // Validate required fields and enforce length limits
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: getRateHeaders(remaining) },
      );
    }

    const raw = body as Record<string, unknown>;

    // Validate id format
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!id || !ID_RE.test(id) || id.length > 64) {
      return NextResponse.json(
        { error: "Invalid capsule id" },
        { status: 400, headers: getRateHeaders(remaining) },
      );
    }

    // Sanitize string fields — truncate to reasonable lengths
    const sanitized = {
      id,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt.slice(0, 30)
          : new Date().toISOString(),
      article:
        typeof raw.article === "string" ? raw.article.slice(0, 10_000) : "",
      imageUrl:
        typeof raw.imageUrl === "string" ? raw.imageUrl.slice(0, 5_000) : null,
      photoUrl:
        typeof raw.photoUrl === "string" ? raw.photoUrl.slice(0, 500_000) : null,
      name: typeof raw.name === "string" ? raw.name.slice(0, 60) : "",
      team: typeof raw.team === "string" ? raw.team.slice(0, 60) : "",
      futureDate:
        typeof raw.futureDate === "string" ? raw.futureDate.slice(0, 10) : "",
      language:
        typeof raw.language === "string" ? raw.language.slice(0, 2) : "",
      shareUrl:
        typeof raw.shareUrl === "string" ? raw.shareUrl.slice(0, 500) : "",
    };

    await saveCapsuleToDb(sanitized);
    return NextResponse.json(
      { success: true },
      { headers: getRateHeaders(remaining) },
    );
  } catch (err) {
    console.error("[api/capsules] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500, headers: getRateHeaders(remaining) },
    );
  }
}

export async function DELETE(req: Request) {
  const ip = getIp(req);
  const { allowed, remaining } = checkRateLimit(
    `capsules:delete:${ip}`,
    DELETE_RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateHeaders(0) },
    );
  }

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (!id || !ID_RE.test(id)) {
      return NextResponse.json(
        { error: "Valid id is required" },
        { status: 400, headers: getRateHeaders(remaining) },
      );
    }

    await deleteCapsuleFromDb(id);
    return NextResponse.json(
      { success: true },
      { headers: getRateHeaders(remaining) },
    );
  } catch (err) {
    console.error("[api/capsules] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500, headers: getRateHeaders(remaining) },
    );
  }
}
