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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Share2, 
  Copy, 
  Check, 
  Link as LinkIcon,
  Globe,
  Lock
} from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawingId: number | null;
  drawingName: string;
}

export default function ShareDialog({
  open,
  onOpenChange,
  drawingId,
  drawingName,
}: ShareDialogProps) {
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && drawingId) {
      // Reset state when dialog opens
      setShareToken(null);
      setIsPublic(false);
      setCopied(false);
      setError("");
    }
  }, [open, drawingId]);

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`
    : "";

  const handleEnableSharing = async () => {
    if (!drawingId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/drawings/${drawingId}/share`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to enable sharing");
        return;
      }

      const data = await res.json();
      setShareToken(data.shareToken);
      setIsPublic(data.isPublic);
    } catch {
      setError("Failed to enable sharing");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSharing = async () => {
    if (!drawingId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/drawings/${drawingId}/share`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to disable sharing");
        return;
      }

      setIsPublic(false);
    } catch {
      setError("Failed to disable sharing");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Drawing
          </DialogTitle>
          <DialogDescription>
            Share &quot;{drawingName}&quot; with anyone using a public link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isPublic ? (
            // Not shared yet
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">This drawing is private</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enable sharing to create a public link that anyone can view
              </p>
              <Button onClick={handleEnableSharing} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Enable Sharing
              </Button>
            </div>
          ) : (
            // Already shared - show link
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-500 rounded-lg">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium">Sharing is enabled</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareUrl}
                    readOnly
                    className="bg-background font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(shareUrl, "_blank")}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Open Link
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDisableSharing}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Disable Sharing
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded text-center">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

