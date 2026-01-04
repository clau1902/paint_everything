"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import PaintCanvas, { Tool } from "./components/PaintCanvas";
import Toolbar from "./components/Toolbar";
import { Palette, Brush, Square, Circle, Minus, PaintBucket } from "lucide-react";

export default function Home() {
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleHistoryChange = useCallback((undo: boolean, redo: boolean) => {
    setCanUndo(undo);
    setCanRedo(redo);
  }, []);

  const handleUndo = () => setUndoTrigger((prev) => prev + 1);
  const handleRedo = () => setRedoTrigger((prev) => prev + 1);
  const handleClear = () => setClearTrigger((prev) => prev + 1);

  const handleSave = () => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `painting-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          handleSave();
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
  }, []);

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
            <p className="text-xs text-muted-foreground">Unleash your creativity</p>
          </div>
        </div>
        
        {/* Quick status */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
          onSave={handleSave}
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
              undoTrigger={undoTrigger}
              redoTrigger={redoTrigger}
              clearTrigger={clearTrigger}
            />
            
            {/* Canvas corner decorations */}
            <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-border/30 rounded-tl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-border/30 rounded-tr opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-border/30 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-border/30 rounded-br opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </main>
  );
}
