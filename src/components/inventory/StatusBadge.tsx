import { cn } from "@/lib/utils";
import type { ServerStatus } from "@/types/server";

const styles: Record<ServerStatus, string> = {
  Active: "bg-status-active/10 text-status-active border-status-active/30",
  Down: "bg-status-down/10 text-status-down border-status-down/30",
  Maintenance: "bg-status-maintenance/10 text-status-maintenance border-status-maintenance/30",
};

const dot: Record<ServerStatus, string> = {
  Active: "bg-status-active",
  Down: "bg-status-down",
  Maintenance: "bg-status-maintenance",
};

export function StatusBadge({ status, className }: { status: ServerStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[status],
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          dot[status],
          status === "Active" && "ring-pulse"
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
