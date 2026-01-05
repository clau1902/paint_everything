import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drawings, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Get a shared drawing by token (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Invalid share token" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Find the drawing by share token
    const drawing = await db.query.drawings.findFirst({
      where: and(
        eq(drawings.shareToken, token),
        eq(drawings.isPublic, true)
      ),
    });

    if (!drawing) {
      return NextResponse.json(
        { error: "Drawing not found or is no longer shared" },
        { status: 404 }
      );
    }

    // Get the author's name
    const author = await db.query.users.findFirst({
      where: eq(users.id, drawing.userId),
      columns: { name: true },
    });

    return NextResponse.json({
      drawing: {
        id: drawing.id,
        name: drawing.name,
        imageData: drawing.imageData,
        authorName: author?.name || "Unknown Artist",
        createdAt: drawing.createdAt,
      },
    });
  } catch (error) {
    console.error("Get shared drawing error:", error);
    return NextResponse.json(
      { error: "Failed to get shared drawing" },
      { status: 500 }
    );
  }
}

