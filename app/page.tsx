"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import PaintCanvas, { Tool } from "./components/PaintCanvas";
import Toolbar from "./components/Toolbar";
import AuthDialog from "./components/AuthDialog";
import UserMenu from "./components/UserMenu";
import GalleryDialog from "./components/GalleryDialog";
import SaveDialog from "./components/SaveDialog";
import ShareDialog from "./components/ShareDialog";
import SaveStatusIndicator, { SaveStatus } from "./components/SaveStatusIndicator";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Palette, Brush, Square, Circle, Minus, PaintBucket, LogIn, Save, Cloud, Share2 } from "lucide-react";

const AUTO_SAVE_DELAY = 3000; // 3 seconds after last change

export default function Home() {
  const { user, loading } = useAuth();
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [loadTrigger, setLoadTrigger] = useState<{ imageData: string } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Current drawing state
  const [currentDrawingId, setCurrentDrawingId] = useState<number | null>(null);
  const [currentDrawingName, setCurrentDrawingName] = useState("");
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  const handleHistoryChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  const handleUndo = () => setUndoTrigger((prev) => prev + 1);
  const handleRedo = () => setRedoTrigger((prev) => prev + 1);
  const handleClear = () => {
    setClearTrigger((prev) => prev + 1);
    setCurrentDrawingId(null);
    setCurrentDrawingName("");
    setSaveStatus("idle");
    setLastSaved(null);
    hasUnsavedChanges.current = false;
  };

  const getCanvasData = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return null;

    const canvas = container.querySelector("canvas");
    if (!canvas) return null;

    return {
      imageData: canvas.toDataURL("image/png"),
      thumbnail: createThumbnail(canvas),
    };
  }, []);

  const createThumbnail = (canvas: HTMLCanvasElement) => {
    const thumbCanvas = document.createElement("canvas");
    const maxSize = 200;
    const ratio = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    thumbCanvas.width = canvas.width * ratio;
    thumbCanvas.height = canvas.height * ratio;
    
    const ctx = thumbCanvas.getContext("2d");
    if (!ctx) return null;
    
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    return thumbCanvas.toDataURL("image/jpeg", 0.7);
  };

  const handleDownload = () => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${currentDrawingName || "painting"}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleSaveClick = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleShareClick = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (!currentDrawingId) {
      // Need to save first
      setSaveDialogOpen(true);
      return;
    }
    setShareDialogOpen(true);
  };

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!user || !currentDrawingId || !currentDrawingName) return;
    if (!hasUnsavedChanges.current) return;

    const data = getCanvasData();
    if (!data) return;

    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/drawings/${currentDrawingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentDrawingName,
          imageData: data.imageData,
          thumbnail: data.thumbnail,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaveStatus("saved");
      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error("Auto-save error:", error);
      setSaveStatus("error");
      // Retry after 5 seconds
      setTimeout(() => {
        if (hasUnsavedChanges.current) {
          performAutoSave();
        }
      }, 5000);
    }
  }, [user, currentDrawingId, currentDrawingName, getCanvasData]);

  // Handle canvas changes - schedule auto-save
  const handleCanvasChange = useCallback(() => {
    if (!user || !currentDrawingId) return;

    hasUnsavedChanges.current = true;
    setSaveStatus("unsaved");

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Schedule auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [user, currentDrawingId, performAutoSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Save before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current && user && currentDrawingId) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user, currentDrawingId]);

  const handleSave = async (name: string) => {
    const data = getCanvasData();
    if (!data) throw new Error("Could not get canvas data");

    setSaveStatus("saving");
    try {
      const url = currentDrawingId 
        ? `/api/drawings/${currentDrawingId}` 
        : "/api/drawings";
      const method = currentDrawingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          imageData: data.imageData,
          thumbnail: data.thumbnail,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const result = await res.json();
      setCurrentDrawingId(result.drawing.id);
      setCurrentDrawingName(name);
      setSaveStatus("saved");
      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      setSaveStatus("error");
      throw error;
    }
  };

  const handleLoadDrawing = async (id: number) => {
    try {
      const res = await fetch(`/api/drawings/${id}`);
      if (!res.ok) throw new Error("Failed to load drawing");

      const { drawing } = await res.json();
      setCurrentDrawingId(drawing.id);
      setCurrentDrawingName(drawing.name);
      setLoadTrigger({ imageData: drawing.imageData });
      setSaveStatus("saved");
      setLastSaved(new Date());
      hasUnsavedChanges.current = false;
    } catch (error) {
      console.error("Failed to load drawing:", error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }
        if (e.key === "s") {
          e.preventDefault();
          handleSaveClick();
        }
      } else {
        switch (e.key.toLowerCase()) {
          case "b":
            setTool("brush");
            break;
          case "e":
            setTool("eraser");
            break;
          case "l":
            setTool("line");
            break;
          case "r":
            setTool("rectangle");
            break;
          case "c":
            setTool("circle");
            break;
          case "f":
            setTool("fill");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user]);

  const getToolIcon = () => {
    switch (tool) {
      case "brush": return <Brush className="h-4 w-4" />;
      case "eraser": return <span className="text-sm">🧹</span>;
      case "line": return <Minus className="h-4 w-4" />;
      case "rectangle": return <Square className="h-4 w-4" />;
      case "circle": return <Circle className="h-4 w-4" />;
      case "fill": return <PaintBucket className="h-4 w-4" />;
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
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
            <p className="text-xs text-muted-foreground">
              {currentDrawingName ? (
                <span className="flex items-center gap-1">
                  <Cloud className="h-3 w-3" />
                  {currentDrawingName}
                </span>
              ) : (
                "Unleash your creativity"
              )}
            </p>
          </div>
        </div>
        
        {/* Quick status & auth */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-muted/30 rounded-full">
            <div className="flex items-center gap-2">
              {getToolIcon()}
              <span className="capitalize">{tool}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-border shadow-sm" 
                style={{ backgroundColor: color }} 
              />
              <span className="font-mono text-xs">{color.toUpperCase()}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <span className="font-mono text-xs">{brushSize}px</span>
          </div>

          {/* Save Status Indicator */}
          <SaveStatusIndicator
            status={saveStatus}
            lastSaved={lastSaved}
            isLoggedIn={!!user}
          />

          {/* Share button - only show when drawing is saved */}
          {currentDrawingId && user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareClick}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}

          {/* Save to cloud button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveClick}
            disabled={saveStatus === "saving"}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">
              {currentDrawingId ? "Save As" : "Save"}
            </span>
          </Button>

          {/* Auth section */}
          {!loading && (
            user ? (
              <UserMenu onOpenGallery={() => setGalleryDialogOpen(true)} />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setAuthDialogOpen(true)}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )
          )}
        </div>
      </header>

      {/* Workspace */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Toolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onSave={handleDownload}
        />

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col p-5 bg-[repeating-conic-gradient(#1c1c26_0%_25%,#15151c_0%_50%)] bg-[length:20px_20px]">
          <div 
            ref={canvasContainerRef}
            className="flex-1 rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50 bg-white relative group"
          >
            <PaintCanvas
              tool={tool}
              color={color}
              brushSize={brushSize}
              onHistoryChange={handleHistoryChange}
              onCanvasChange={handleCanvasChange}
              undoTrigger={undoTrigger}
              redoTrigger={redoTrigger}
              clearTrigger={clearTrigger}
              loadTrigger={loadTrigger}
            />
            
            {/* Canvas corner decorations */}
            <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-border/30 rounded-tl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-border/30 rounded-tr opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-border/30 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-border/30 rounded-br opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <GalleryDialog
        open={galleryDialogOpen}
        onOpenChange={setGalleryDialogOpen}
        onLoadDrawing={handleLoadDrawing}
      />
      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        currentDrawingId={currentDrawingId}
        currentDrawingName={currentDrawingName}
      />
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        drawingId={currentDrawingId}
        drawingName={currentDrawingName}
      />
    </main>
  );
}
