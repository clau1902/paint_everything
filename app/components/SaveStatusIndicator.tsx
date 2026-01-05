"use client";

import { Cloud, CloudOff, Loader2, Check, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  isLoggedIn: boolean;
}

export default function SaveStatusIndicator({
  status,
  lastSaved,
  isLoggedIn,
}: SaveStatusIndicatorProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 10) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  const getStatusConfig = () => {
    if (!isLoggedIn) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        text: "Sign in to save",
        color: "text-muted-foreground",
        bgColor: "bg-muted/50",
        tooltip: "Sign in to enable auto-save",
      };
    }

    switch (status) {
      case "idle":
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: "Ready",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          tooltip: "No changes to save",
        };
      case "unsaved":
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: "Unsaved",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          tooltip: "Changes will auto-save soon...",
          pulse: true,
        };
      case "saving":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: "Saving...",
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          tooltip: "Saving your changes...",
        };
      case "saved":
        return {
          icon: <Check className="h-4 w-4" />,
          text: lastSaved ? formatLastSaved(lastSaved) : "Saved",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          tooltip: lastSaved
            ? `Last saved at ${lastSaved.toLocaleTimeString()}`
            : "All changes saved",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: "Error",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          tooltip: "Failed to save. Will retry...",
        };
      default:
        return {
          icon: <Cloud className="h-4 w-4" />,
          text: "Ready",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          tooltip: "Ready to save",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${config.color} ${config.bgColor}`}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

