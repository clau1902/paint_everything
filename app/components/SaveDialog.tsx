"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
  currentDrawingId: number | null;
  currentDrawingName: string;
}

export default function SaveDialog({
  open,
  onOpenChange,
  onSave,
  currentDrawingId,
  currentDrawingName,
}: SaveDialogProps) {
  const [name, setName] = useState(currentDrawingName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentDrawingName || "");
      setError("");
    }
  }, [open, currentDrawingName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for your drawing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSave(name.trim());
      onOpenChange(false);
    } catch {
      setError("Failed to save drawing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {currentDrawingId ? "Update Drawing" : "Save Drawing"}
          </DialogTitle>
          <DialogDescription>
            {currentDrawingId
              ? "Update your existing drawing or save as a new one"
              : "Give your artwork a name to save it"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="drawing-name">Drawing Name</Label>
              <Input
                id="drawing-name"
                placeholder="My Masterpiece"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentDrawingId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

