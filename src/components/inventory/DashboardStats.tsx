import { useEffect, ReactNode } from "react";
import { 
  Server as ServerIcon, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  Monitor, 
  User, 
  Network, 
  ShieldAlert, 
  Cpu, 
  Globe 
} from "lucide-react";
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

function BreakdownList({
  title,
  icon,
  data,
  total,
}: {
  title: string;
  icon: ReactNode;
  data: { label: string; value: number }[];
  total: number;
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <div className="text-muted-foreground">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {sorted.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground truncate max-w-[180px]">{item.label}</span>
                <span className="text-muted-foreground font-mono">{item.value} ({pct}%)</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-500" 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">No data available</p>
        )}
      </div>
    </div>
  );
}

function RatioBar({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  total,
  icon,
}: {
  title: string;
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  total: number;
  icon: ReactNode;
}) {
  const leftPct = total ? Math.round((leftValue / total) * 100) : 50;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="h-3 w-full bg-muted rounded-md overflow-hidden flex">
        <div 
          className="h-full bg-accent transition-all duration-500" 
          style={{ width: `${leftPct}%` }}
          title={`${leftLabel}: ${leftValue}`}
        />
        <div 
          className="h-full bg-warning transition-all duration-500 flex-1" 
          title={`${rightLabel}: ${rightValue}`}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
        <span>{leftLabel}: {leftValue} ({leftPct}%)</span>
        <span>{rightLabel}: {rightValue} ({100 - leftPct}%)</span>
      </div>
    </div>
  );
}

export function DashboardStats() {
  const { dashboardStats, loadingStats, fetchDashboardStats } = useServerStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card h-24 bg-muted/20 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card h-48 bg-muted/20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardStats) return null;

  const { counts, states, locations, siteTypes, operatingSystems, owners } = dashboardStats;
  const patchedPct = counts.total ? Math.round((counts.patched / counts.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Servers"
          value={counts.total}
          delta={`${counts.active} active · ${counts.down} down · ${counts.decommissioned} decom`}
          icon={<ServerIcon className="w-5 h-5" />}
          tone="primary"
        />
        <StatCard
          label="Patched Compliance"
          value={`${patchedPct}%`}
          delta={`${counts.patched} of ${counts.total} compliant`}
          icon={<ShieldCheck className="w-5 h-5" />}
          tone="success"
        />
        <StatCard
          label="Critical Servers"
          value={counts.critical}
          delta="High priority assets"
          icon={<AlertTriangle className="w-5 h-5" />}
          tone="warning"
        />
        <StatCard
          label="Down / Issues"
          value={counts.down}
          delta="Requires attention"
          icon={<Activity className="w-5 h-5" />}
          tone="danger"
        />
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Locations & Distribution */}
        <div className="space-y-4">
          <BreakdownList 
            title="Servers by State" 
            icon={<MapPin className="w-4 h-4" />} 
            data={states} 
            total={counts.total} 
          />
          <BreakdownList 
            title="Servers by Location" 
            icon={<MapPin className="w-4 h-4" />} 
            data={locations} 
            total={counts.total} 
          />
        </div>

        {/* Column 2: Specs & OS */}
        <div className="space-y-4">
          <BreakdownList 
            title="Operating Systems" 
            icon={<Monitor className="w-4 h-4" />} 
            data={operatingSystems} 
            total={counts.total} 
          />
          <BreakdownList 
            title="Servers by Owner" 
            icon={<User className="w-4 h-4" />} 
            data={owners} 
            total={counts.total} 
          />
        </div>

        {/* Column 3: Asset Types & Segregation */}
        <div className="surface-card p-5 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Asset Specifications</h3>
          </div>

          <RatioBar
            title="Virtual vs Physical"
            leftLabel="Virtual"
            leftValue={counts.virtualServers}
            rightLabel="Physical"
            rightValue={counts.physicalServers}
            total={counts.total}
            icon={<Cpu className="w-3.5 h-3.5" />}
          />

          <RatioBar
            title="Internet Exposure"
            leftLabel="Internal Only"
            leftValue={counts.total - counts.internetFacing}
            rightLabel="Internet Facing"
            rightValue={counts.internetFacing}
            total={counts.total}
            icon={<Globe className="w-3.5 h-3.5" />}
          />

          <RatioBar
            title="PCI Asset Boundaries"
            leftLabel="Non-PCI"
            leftValue={counts.total - counts.pciAssets}
            rightLabel="PCI Asset"
            rightValue={counts.pciAssets}
            total={counts.total}
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
          />

          <RatioBar
            title="SOCI Assets"
            leftLabel="Non-SOCI"
            leftValue={counts.total - counts.sociAssets}
            rightLabel="SOCI Asset"
            rightValue={counts.sociAssets}
            total={counts.total}
            icon={<Network className="w-3.5 h-3.5" />}
          />
        </div>
      </div>
    </div>
  );
}
