import { ReactNode } from "react";
import { Server, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { useServerStore } from "@/store/serverStore";

function StatCard({
  label,
  value,
  delta,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon: ReactNode;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="surface-card p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground font-mono">
            {value}
          </p>
          {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardStats() {
  const servers = useServerStore((s) => s.servers);
  const total = servers.length;
  const active = servers.filter((s) => s.status === "Active").length;
  const down = servers.filter((s) => s.status === "Down").length;
  const patched = servers.filter((s) => s.isPatched === "Yes").length;
  const critical = servers.filter((s) => s.priority === "High").length;
  const patchedPct = total ? Math.round((patched / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Servers"
        value={total}
        delta={`${active} active · ${down} down`}
        icon={<Server className="w-5 h-5" />}
        tone="primary"
      />
      <StatCard
        label="Patched"
        value={`${patchedPct}%`}
        delta={`${patched} of ${total} compliant`}
        icon={<ShieldCheck className="w-5 h-5" />}
        tone="success"
      />
      <StatCard
        label="Critical Servers"
        value={critical}
        delta="High priority assets"
        icon={<AlertTriangle className="w-5 h-5" />}
        tone="warning"
      />
      <StatCard
        label="Down / Issues"
        value={down}
        delta="Requires attention"
        icon={<Activity className="w-5 h-5" />}
        tone="danger"
      />
    </div>
  );
}
