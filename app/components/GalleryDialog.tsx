"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, FolderOpen } from "lucide-react";

interface Drawing {
  id: number;
  name: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadDrawing: (id: number) => void;
}

export default function GalleryDialog({
  open,
  onOpenChange,
  onLoadDrawing,
}: GalleryDialogProps) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchDrawings();
    }
  }, [open]);

  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drawings");
      if (res.ok) {
        const data = await res.json();
        setDrawings(data.drawings);
      }
    } catch (error) {
      console.error("Failed to fetch drawings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this drawing?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/drawings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDrawings(drawings.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete drawing:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleLoad = (id: number) => {
    onLoadDrawing(id);
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            My Drawings
          </DialogTitle>
          <DialogDescription>
            Click on a drawing to load it into the canvas
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : drawings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No saved drawings yet</p>
              <p className="text-sm mt-1">Start creating and save your artwork!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {drawings.map((drawing) => (
                <Card
                  key={drawing.id}
                  className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleLoad(drawing.id)}
                >
                  <div className="aspect-video bg-muted relative">
                    {drawing.thumbnail ? (
                      <img
                        src={drawing.thumbnail}
                        alt={drawing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No preview
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(drawing.id, e)}
                      disabled={deleting === drawing.id}
                    >
                      {deleting === drawing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate">{drawing.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(drawing.updatedAt)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

