import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET all drawings for the authenticated user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const db = getDb();
    const userDrawings = await db.query.drawings.findMany({
      where: eq(drawings.userId, session.userId),
      orderBy: [desc(drawings.updatedAt)],
      columns: {
        id: true,
        name: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ drawings: userDrawings });
  } catch (error) {
    console.error("Get drawings error:", error);
    return NextResponse.json(
      { error: "Failed to get drawings" },
      { status: 500 }
    );
  }
}

// POST create a new drawing
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { name, imageData, thumbnail } = await request.json();

    if (!name || !imageData) {
      return NextResponse.json(
        { error: "Name and image data are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newDrawing] = await db.insert(drawings).values({
      userId: session.userId,
      name,
      imageData,
      thumbnail,
    }).returning();

    return NextResponse.json({
      drawing: {
        id: newDrawing.id,
        name: newDrawing.name,
        thumbnail: newDrawing.thumbnail,
        createdAt: newDrawing.createdAt,
        updatedAt: newDrawing.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create drawing error:", error);
    return NextResponse.json(
      { error: "Failed to create drawing" },
      { status: 500 }
    );
  }
}

