import { Bell } from "lucide-react";
import { QuickSearch } from "./QuickSearch";

export function TopBar() {
  return (
    <header className="h-auto min-h-16 shrink-0 bg-card border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-6 py-3">
      <div className="shrink-0">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Windows Server Inventory
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage and audit your Windows fleet
        </p>
      </div>

      <div className="flex-1 flex justify-center lg:px-6 min-w-0">
        <QuickSearch />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="relative w-9 h-9 rounded-md hover:bg-muted flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            AO
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-foreground">Admin Ops</p>
            <p className="text-[11px] text-muted-foreground">admin@corp</p>
          </div>
        </div>
      </div>
    </header>
  );
}
