"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Palette, Download, ArrowLeft, User, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

interface SharedDrawing {
  id: number;
  name: string;
  imageData: string;
  authorName: string;
  createdAt: string;
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [drawing, setDrawing] = useState<SharedDrawing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDrawing() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Drawing not found");
          return;
        }
        const data = await res.json();
        setDrawing(data.drawing);
      } catch {
        setError("Failed to load drawing");
      } finally {
        setLoading(false);
      }
    }

    fetchDrawing();
  }, [token]);

  const handleDownload = () => {
    if (!drawing) return;

    const link = document.createElement("a");
    link.download = `${drawing.name}.png`;
    link.href = drawing.imageData;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading artwork...</p>
        </div>
      </div>
    );
  }

  if (error || !drawing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h1 className="text-2xl font-bold mb-2">Drawing Not Found</h1>
            <p className="text-muted-foreground">
              {error || "This drawing may have been deleted or is no longer shared."}
            </p>
          </div>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Paint Everything
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative">
            <Palette className="h-8 w-8 text-orange-500" />
            <div className="absolute inset-0 h-8 w-8 text-orange-500 blur-lg opacity-50">
              <Palette className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
              Paint Everything
            </h1>
            <p className="text-xs text-muted-foreground">Shared Artwork</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Link href="/">
            <Button>
              Create Your Own
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Drawing Info */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold mb-2">{drawing.name}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {drawing.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(drawing.createdAt)}
            </span>
          </div>
        </div>

        {/* Drawing Display */}
        <Card className="overflow-hidden shadow-2xl border-2 border-border/50">
          <div className="bg-[repeating-conic-gradient(#f0f0f0_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] p-4">
            <img
              src={drawing.imageData}
              alt={drawing.name}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            Inspired? Create your own masterpiece!
          </p>
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Palette className="h-5 w-5" />
              Start Painting
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}



