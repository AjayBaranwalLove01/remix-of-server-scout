import { useEffect, useState } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { useServerStore, type SearchFilter } from "@/store/serverStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

const STATUS_SUGGESTIONS = ["Active", "Down", "Maintenance", "Patched", "Unpatched"];

const FILTER_META: Record<SearchFilter, { label: string; hint: string }> = {
  status: { label: "Status", hint: "Active · Down · Patched" },
  custom: { label: "Custom Fields", hint: "Name, IP, serial, contact, domain" },
};

export function QuickSearch() {
  const {
    searchTerm,
    searchFilters,
    setSearchTerm,
    toggleSearchFilter,
    resetSearch,
  } = useServerStore();

  // Local input state → debounced into the store for performance
  const [localTerm, setLocalTerm] = useState(searchTerm);
  const debounced = useDebounce(localTerm, 180);

  useEffect(() => {
    setSearchTerm(debounced);
  }, [debounced, setSearchTerm]);

  // Sync external resets back into local input
  useEffect(() => {
    if (searchTerm === "" && localTerm !== "") setLocalTerm("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const hasStatus = searchFilters.includes("status");
  const hasCustom = searchFilters.includes("custom");
  const triggerLabel =
    hasStatus && hasCustom
      ? "Status + Custom Fields"
      : hasStatus
      ? "Status"
      : "Custom Fields";

  const placeholder =
    hasStatus && hasCustom
      ? "Search status, name, IP, serial, contact..."
      : hasStatus
      ? "Filter by status: Active, Down, Patched..."
      : "Search name, IP, serial, contact, domain...";

  const clearAll = () => {
    setLocalTerm("");
    resetSearch();
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-2xl">
      <div className="flex items-stretch gap-2">
        {/* Search input */}
        <div
          className={cn(
            "flex items-center gap-2 h-10 px-3 rounded-md bg-muted/40 border border-border flex-1 transition-all",
            "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 focus-within:bg-card"
          )}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={localTerm}
            onChange={(e) => setLocalTerm(e.target.value)}
            placeholder={placeholder}
            list={hasStatus ? "status-suggestions" : undefined}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          />
          {hasStatus && (
            <datalist id="status-suggestions">
              {STATUS_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          {localTerm && (
            <button
              onClick={clearAll}
              aria-label="Clear search"
              className="w-5 h-5 rounded-sm hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search In multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-card text-sm font-medium",
                "hover:bg-muted transition-colors whitespace-nowrap"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Search In
              </span>
              <span className="text-foreground">{triggerLabel}</span>
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent/15 text-accent text-[10px] font-bold">
                {searchFilters.length}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Search Scope
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(FILTER_META) as SearchFilter[]).map((key) => {
              const checked = searchFilters.includes(key);
              const isLastChecked = checked && searchFilters.length === 1;
              const meta = FILTER_META[key];
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLastChecked) toggleSearchFilter(key);
                  }}
                  disabled={isLastChecked}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-2 py-2 rounded-sm text-left transition-colors",
                    "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-80",
                    checked && "bg-accent/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      checked
                        ? "bg-accent border-accent text-accent-foreground"
                        : "border-border bg-card"
                    )}
                  >
                    {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {meta.hint}
                    </span>
                  </div>
                </button>
              );
            })}
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-[10px] text-muted-foreground">
              Selecting both performs an OR match across status and custom fields.
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filter indicator */}
      {(localTerm || searchFilters.length < 2) && (
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pl-1">
          <span className="text-muted-foreground">Searching in:</span>
          {searchFilters.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {FILTER_META[f].label}
            </span>
          ))}
          {localTerm && (
            <>
              <span className="text-muted-foreground">·</span>
              <span>
                Query:{" "}
                <span className="font-mono text-foreground">"{localTerm}"</span>
              </span>
              <button
                onClick={clearAll}
                className="ml-auto hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                Reset
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
