"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export type Tool = "brush" | "eraser" | "line" | "rectangle" | "circle" | "fill";

interface PaintCanvasProps {
  tool: Tool;
  color: string;
  brushSize: number;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  undoTrigger: number;
  redoTrigger: number;
  clearTrigger: number;
}

interface HistoryState {
  past: ImageData[];
  future: ImageData[];
}

export default function PaintCanvas({
  tool,
  color,
  brushSize,
  onHistoryChange,
  undoTrigger,
  redoTrigger,
  clearTrigger,
}: PaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  // Store the canvas state before starting to draw a shape
  const preShapeImageRef = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    // Save initial state
    const initialState = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory({ past: [initialState], future: [] });
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.putImageData(imageData, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update history callback
  useEffect(() => {
    onHistoryChange(history.past.length > 1, history.future.length > 0);
  }, [history, onHistoryChange]);

  // Handle undo
  useEffect(() => {
    if (undoTrigger === 0) return;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || history.past.length <= 1) return;

    const newPast = [...history.past];
    const current = newPast.pop()!;
    const previous = newPast[newPast.length - 1];

    context.putImageData(previous, 0, 0);
    setHistory({
      past: newPast,
      future: [current, ...history.future],
    });
  }, [undoTrigger]);

  // Handle redo
  useEffect(() => {
    if (redoTrigger === 0) return;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || history.future.length === 0) return;

    const newFuture = [...history.future];
    const next = newFuture.shift()!;

    context.putImageData(next, 0, 0);
    setHistory({
      past: [...history.past, next],
      future: newFuture,
    });
  }, [redoTrigger]);

  // Handle clear
  useEffect(() => {
    if (clearTrigger === 0) return;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }, [clearTrigger]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => ({
      past: [...prev.past.slice(-50), imageData], // Keep last 50 states
      future: [],
    }));
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const x = Math.floor(startX);
    const y = Math.floor(startY);
    
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const startIdx = (y * width + x) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    // Parse fill color
    const hex = fillColor.replace("#", "");
    const fillR = parseInt(hex.substring(0, 2), 16);
    const fillG = parseInt(hex.substring(2, 4), 16);
    const fillB = parseInt(hex.substring(4, 6), 16);

    // Check if we're already at the fill color
    if (startR === fillR && startG === fillG && startB === fillB && startA === 255) return;

    // Use a Uint8Array for visited pixels (much faster than Set)
    const visited = new Uint8Array(width * height);
    
    // Tolerance for color matching (higher = more lenient)
    const tolerance = 32;
    
    const matchesStartColor = (idx: number): boolean => {
      return (
        Math.abs(data[idx] - startR) <= tolerance &&
        Math.abs(data[idx + 1] - startG) <= tolerance &&
        Math.abs(data[idx + 2] - startB) <= tolerance
      );
    };

    const setPixel = (idx: number) => {
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = 255;
    };

    // Scanline flood fill algorithm - more efficient and complete
    const stack: [number, number][] = [[x, y]];
    
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      
      // Find the leftmost pixel in this row that matches
      let lx = cx;
      while (lx > 0) {
        const idx = (cy * width + lx - 1) * 4;
        const pixelIdx = cy * width + lx - 1;
        if (visited[pixelIdx] || !matchesStartColor(idx)) break;
        lx--;
      }
      
      // Scan right from leftmost, filling pixels and checking rows above/below
      let spanAbove = false;
      let spanBelow = false;
      
      for (let sx = lx; sx < width; sx++) {
        const idx = (cy * width + sx) * 4;
        const pixelIdx = cy * width + sx;
        
        if (visited[pixelIdx] || !matchesStartColor(idx)) break;
        
        // Mark as visited and fill
        visited[pixelIdx] = 1;
        setPixel(idx);
        
        // Check pixel above
        if (cy > 0) {
          const aboveIdx = ((cy - 1) * width + sx) * 4;
          const abovePixelIdx = (cy - 1) * width + sx;
          const aboveMatches = !visited[abovePixelIdx] && matchesStartColor(aboveIdx);
          
          if (!spanAbove && aboveMatches) {
            stack.push([sx, cy - 1]);
            spanAbove = true;
          } else if (spanAbove && !aboveMatches) {
            spanAbove = false;
          }
        }
        
        // Check pixel below
        if (cy < height - 1) {
          const belowIdx = ((cy + 1) * width + sx) * 4;
          const belowPixelIdx = (cy + 1) * width + sx;
          const belowMatches = !visited[belowPixelIdx] && matchesStartColor(belowIdx);
          
          if (!spanBelow && belowMatches) {
            stack.push([sx, cy + 1]);
            spanBelow = true;
          } else if (spanBelow && !belowMatches) {
            spanBelow = false;
          }
        }
      }
    }

    context.putImageData(imageData, 0, 0);
  };

  const drawShape = (
    context: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    shapeType: "line" | "rectangle" | "circle"
  ) => {
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";

    if (shapeType === "line") {
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
    } else if (shapeType === "rectangle") {
      context.beginPath();
      context.strokeRect(startX, startY, endX - startX, endY - startY);
    } else if (shapeType === "circle") {
      // Calculate the center and radius for ellipse
      const width = endX - startX;
      const height = endY - startY;
      const centerX = startX + width / 2;
      const centerY = startY + height / 2;
      const radiusX = Math.abs(width / 2);
      const radiusY = Math.abs(height / 2);
      
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.stroke();
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!context || !canvas) return;

    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (tool === "fill") {
      floodFill(pos.x, pos.y, color);
      saveToHistory();
      return;
    }

    // For shapes, save the current canvas state before drawing
    if (tool === "line" || tool === "rectangle" || tool === "circle") {
      preShapeImageRef.current = context.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (tool === "brush" || tool === "eraser") {
      context.beginPath();
      context.moveTo(pos.x, pos.y);
      context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      context.lineWidth = brushSize;
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const pos = getPos(e);

    if (tool === "brush" || tool === "eraser") {
      context.lineTo(pos.x, pos.y);
      context.stroke();
    } else if (tool === "line" || tool === "rectangle" || tool === "circle") {
      // Restore the pre-shape canvas state
      if (preShapeImageRef.current) {
        context.putImageData(preShapeImageRef.current, 0, 0);
      }
      
      // Draw the shape preview
      drawShape(context, startPos.x, startPos.y, pos.x, pos.y, tool);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    if (context && canvas) {
      if (tool === "brush" || tool === "eraser") {
        context.closePath();
      } else if (tool === "line" || tool === "rectangle" || tool === "circle") {
        // Get final position
        const pos = getPos(e);
        
        // Restore the pre-shape canvas state one final time
        if (preShapeImageRef.current) {
          context.putImageData(preShapeImageRef.current, 0, 0);
        }
        
        // Draw the final shape
        drawShape(context, startPos.x, startPos.y, pos.x, pos.y, tool);
        
        // Clear the saved state
        preShapeImageRef.current = null;
      }
    }

    setIsDrawing(false);
    saveToHistory();
  };

  return (
    <canvas
      ref={canvasRef}
      className="touch-none cursor-crosshair"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
    />
  );
}
