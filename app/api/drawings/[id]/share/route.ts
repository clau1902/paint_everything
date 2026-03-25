import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateShareToken(): string {
  return randomBytes(16).toString("hex");
}

// POST - Enable sharing and get/create share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const drawingId = parseInt(id);

    if (isNaN(drawingId)) {
      return NextResponse.json(
        { error: "Invalid drawing ID" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if drawing exists and belongs to user
    const drawing = await db.query.drawings.findFirst({
      where: and(
        eq(drawings.id, drawingId),
        eq(drawings.userId, session.userId)
      ),
    });

    if (!drawing) {
      return NextResponse.json(
        { error: "Drawing not found" },
        { status: 404 }
      );
    }

    // Generate share token if it doesn't exist
    const shareToken = drawing.shareToken || generateShareToken();

    const [updatedDrawing] = await db
      .update(drawings)
      .set({
        shareToken,
        isPublic: true,
        updatedAt: new Date(),
      })
      .where(eq(drawings.id, drawingId))
      .returning();

    return NextResponse.json({
      shareToken: updatedDrawing.shareToken,
      isPublic: updatedDrawing.isPublic,
    });
  } catch (error) {
    console.error("Share drawing error:", error);
    return NextResponse.json(
      { error: "Failed to share drawing" },
      { status: 500 }
    );
  }
}

// DELETE - Disable sharing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const drawingId = parseInt(id);

    if (isNaN(drawingId)) {
      return NextResponse.json(
        { error: "Invalid drawing ID" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if drawing exists and belongs to user
    const drawing = await db.query.drawings.findFirst({
      where: and(
        eq(drawings.id, drawingId),
        eq(drawings.userId, session.userId)
      ),
    });

    if (!drawing) {
      return NextResponse.json(
        { error: "Drawing not found" },
        { status: 404 }
      );
    }

    await db
      .update(drawings)
      .set({
        isPublic: false,
        updatedAt: new Date(),
      })
      .where(eq(drawings.id, drawingId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unshare drawing error:", error);
    return NextResponse.json(
      { error: "Failed to unshare drawing" },
      { status: 500 }
    );
  }
}



