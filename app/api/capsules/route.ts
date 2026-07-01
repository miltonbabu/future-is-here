import { NextResponse } from "next/server";
import {
  getAllCapsulesFromDb,
  saveCapsuleToDb,
  deleteCapsuleFromDb,
} from "@/lib/db";

export async function GET() {
  try {
    const capsules = await getAllCapsulesFromDb();
    return NextResponse.json(capsules);
  } catch (err) {
    console.error("[api/capsules] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch capsules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await saveCapsuleToDb(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/capsules] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to save capsule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteCapsuleFromDb(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/capsules] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete capsule" },
      { status: 500 }
    );
  }
}
