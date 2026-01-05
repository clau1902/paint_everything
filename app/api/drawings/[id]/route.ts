import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// GET a specific drawing
export async function GET(
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

    return NextResponse.json({ drawing });
  } catch (error) {
    console.error("Get drawing error:", error);
    return NextResponse.json(
      { error: "Failed to get drawing" },
      { status: 500 }
    );
  }
}

// PUT update a drawing
export async function PUT(
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

    const { name, imageData, thumbnail } = await request.json();

    const db = getDb();
    
    // Check if drawing exists and belongs to user
    const existingDrawing = await db.query.drawings.findFirst({
      where: and(
        eq(drawings.id, drawingId),
        eq(drawings.userId, session.userId)
      ),
    });

    if (!existingDrawing) {
      return NextResponse.json(
        { error: "Drawing not found" },
        { status: 404 }
      );
    }

    const [updatedDrawing] = await db
      .update(drawings)
      .set({
        name: name || existingDrawing.name,
        imageData: imageData || existingDrawing.imageData,
        thumbnail: thumbnail || existingDrawing.thumbnail,
        updatedAt: new Date(),
      })
      .where(eq(drawings.id, drawingId))
      .returning();

    return NextResponse.json({
      drawing: {
        id: updatedDrawing.id,
        name: updatedDrawing.name,
        thumbnail: updatedDrawing.thumbnail,
        createdAt: updatedDrawing.createdAt,
        updatedAt: updatedDrawing.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update drawing error:", error);
    return NextResponse.json(
      { error: "Failed to update drawing" },
      { status: 500 }
    );
  }
}

// DELETE a drawing
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
    const existingDrawing = await db.query.drawings.findFirst({
      where: and(
        eq(drawings.id, drawingId),
        eq(drawings.userId, session.userId)
      ),
    });

    if (!existingDrawing) {
      return NextResponse.json(
        { error: "Drawing not found" },
        { status: 404 }
      );
    }

    await db.delete(drawings).where(eq(drawings.id, drawingId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete drawing error:", error);
    return NextResponse.json(
      { error: "Failed to delete drawing" },
      { status: 500 }
    );
  }
}
