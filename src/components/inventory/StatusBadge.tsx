import { cn } from "@/lib/utils";
import type { ServerStatus } from "@/types/server";

export function StatusBadge({ status, className }: { status: ServerStatus; className?: string }) {
  const normalized = String(status ?? "").trim().toLowerCase();
  
  let badgeStyle = "bg-muted text-muted-foreground border-border";
  let dotStyle = "bg-muted-foreground";
  let pulse = false;

  if (normalized === "production" || normalized === "active") {
    badgeStyle = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    dotStyle = "bg-emerald-500";
    pulse = true;
  } else if (normalized === "down" || normalized === "unknown") {
    badgeStyle = "bg-red-500/10 text-red-500 border-red-500/30";
    dotStyle = "bg-red-500";
  } else if (normalized === "maintenance" || normalized === "build") {
    badgeStyle = "bg-amber-500/10 text-amber-500 border-amber-500/30";
    dotStyle = "bg-amber-500";
  } else if (normalized === "pre-production" || normalized === "development") {
    badgeStyle = "bg-blue-500/10 text-blue-500 border-blue-500/30";
    dotStyle = "bg-blue-500";
  } else if (normalized === "coles-dev" || normalized === "coles-test" || normalized === "lab") {
    badgeStyle = "bg-purple-500/10 text-purple-500 border-purple-500/30";
    dotStyle = "bg-purple-500";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badgeStyle,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          dotStyle,
          pulse && "ring-pulse"
        )}
      />
      {status}
    </span>
  );
}

export function PatchedBadge({ patched }: { patched: "Yes" | "No" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        patched === "Yes"
          ? "bg-status-patched/10 text-status-patched border-status-patched/30"
          : "bg-status-unpatched/10 text-status-unpatched border-status-unpatched/30"
      )}
    >
      {patched === "Yes" ? "Patched" : "Unpatched"}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const map = {
    High: "bg-destructive/10 text-destructive border-destructive/30",
    Medium: "bg-warning/10 text-warning border-warning/30",
    Low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        map[priority]
      )}
    >
      {priority}
    </span>
  );
}
