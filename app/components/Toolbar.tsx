"use client";

import { Tool } from "./PaintCanvas";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Brush,
  Eraser,
  Minus,
  Square,
  Circle,
  PaintBucket,
  Undo2,
  Redo2,
  Trash2,
  Download,
} from "lucide-react";

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
}

const tools: { id: Tool; name: string; icon: React.ReactNode }[] = [
  { id: "brush", name: "Brush", icon: <Brush className="h-4 w-4" /> },
  { id: "eraser", name: "Eraser", icon: <Eraser className="h-4 w-4" /> },
  { id: "line", name: "Line", icon: <Minus className="h-4 w-4" /> },
  { id: "rectangle", name: "Rectangle", icon: <Square className="h-4 w-4" /> },
  { id: "circle", name: "Circle", icon: <Circle className="h-4 w-4" /> },
  { id: "fill", name: "Fill", icon: <PaintBucket className="h-4 w-4" /> },
];

const presetColors = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#78350f", "#6b7280", "#fda4af", "#86efac", "#c4b5fd",
];

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSave,
}: ToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <aside className="w-[220px] bg-card/50 backdrop-blur-xl border-r border-border/50 p-4 flex flex-col gap-6 overflow-y-auto">
        {/* Tools Section */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {tools.map((t) => (
              <Tooltip key={t.id}>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={tool === t.id}
                    onPressedChange={() => setTool(t.id)}
                    variant="outline"
                    size="lg"
                    className={`
                      w-full aspect-square transition-all duration-200
                      ${tool === t.id 
                        ? "bg-gradient-to-br from-orange-500/20 to-purple-500/20 border-orange-500 text-orange-500 shadow-[0_0_20px_rgba(255,107,74,0.3)]" 
                        : "hover:bg-accent/50 hover:border-accent"
                      }
                    `}
                  >
                    {t.icon}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Colors Section */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Color
          </h3>
          <div className="relative w-full h-12 group">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="w-full h-full rounded-lg border-2 border-border shadow-md transition-all group-hover:border-accent group-hover:scale-[1.02]"
              style={{ backgroundColor: color }}
            />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {presetColors.map((c) => (
              <Tooltip key={c}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setColor(c)}
                    className={`
                      aspect-square rounded-md transition-all duration-200 shadow-sm hover:scale-110 hover:z-10
                      ${color === c 
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" 
                        : "border border-border/50"
                      }
                    `}
                    style={{ backgroundColor: c }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{c.toUpperCase()}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Brush Size Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Size
            </h3>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {brushSize}px
            </span>
          </div>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={1}
            max={100}
            step={1}
            className="[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-orange-500 [&_[data-slot=slider-range]]:to-purple-500 [&_[data-slot=slider-thumb]]:border-orange-500 [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5"
          />
          <div className="flex items-center justify-center h-14 bg-muted/50 rounded-lg border border-border/50">
            <div
              className="rounded-full transition-all duration-200 shadow-sm"
              style={{
                width: Math.min(brushSize, 48),
                height: Math.min(brushSize, 48),
                backgroundColor: color,
              }}
            />
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Actions Section */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="w-full"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="w-full"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClear}
                  className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Canvas</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onSave}
                  className="w-full hover:bg-green-500/10 hover:text-green-500 hover:border-green-500"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Image</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Keyboard Shortcuts */}
        <div className="text-[10px] text-muted-foreground/60 space-y-1">
          <p><kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">B</kbd> Brush</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">E</kbd> Eraser</p>
          <p><kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">⌘Z</kbd> Undo</p>
        </div>
      </aside>
    </TooltipProvider>
  );
}
