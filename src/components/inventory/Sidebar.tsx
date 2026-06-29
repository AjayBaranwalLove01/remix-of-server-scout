import { Server as ServerIcon, LayoutDashboard, ShieldCheck, Database, Activity, Settings } from "lucide-react";

export function Sidebar() {
  const nav = [
    { label: "Overview", icon: LayoutDashboard, active: true },
    { label: "Inventory", icon: ServerIcon, active: false },
    { label: "Patching", icon: ShieldCheck, active: false },
    { label: "Backups", icon: Database, active: false },
    { label: "Monitoring", icon: Activity, active: false },
    { label: "Settings", icon: Settings, active: false },
  ];

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-gradient-accent flex items-center justify-center shadow-glow">
          <ServerIcon className="w-4 h-4 text-accent-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">ServerOps</p>
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
            Inventory Console
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/40 p-3">
          <p className="text-xs font-medium text-sidebar-accent-foreground">All systems</p>
          <p className="text-[11px] text-sidebar-foreground/70 mt-0.5">
            Last sync just now
          </p>
        </div>
      </div>
    </aside>
  );
}
