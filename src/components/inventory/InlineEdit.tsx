import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

interface BaseProps {
  value: string;
  onSave: (next: string) => void;
  className?: string;
  display?: (v: string) => React.ReactNode;
}

interface TextProps extends BaseProps {
  type?: "text" | "date" | "time";
  placeholder?: string;
}

export function InlineText({ value, onSave, className, display, type = "text", placeholder }: TextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1 w-full", className)}>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-8 px-2 text-sm rounded border border-accent bg-background outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button onMouseDown={(e) => { e.preventDefault(); commit(); }} className="text-success hover:bg-success/10 rounded p-1">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onMouseDown={(e) => { e.preventDefault(); cancel(); }} className="text-destructive hover:bg-destructive/10 rounded p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "group inline-flex items-center gap-1.5 max-w-full text-left rounded px-1.5 py-0.5 -mx-1.5 hover:bg-accent/10 transition-colors",
        className
      )}
    >
      <span className="truncate">{display ? display(value) : value || <span className="text-muted-foreground italic">—</span>}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 shrink-0" />
    </button>
  );
}

export function InlineTextarea({ value, onSave, className }: BaseProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    if (draft !== value) onSave(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={3}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-md border border-accent bg-background outline-none focus:ring-2 focus:ring-accent/30 resize-none",
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "group block w-full text-left rounded-md px-3 py-2 text-sm bg-muted/40 hover:bg-accent/10 border border-transparent hover:border-accent/30 transition-colors min-h-[60px]",
        className
      )}
    >
      <span className="whitespace-pre-wrap text-foreground">
        {value || <span className="text-muted-foreground italic">Click to add notes...</span>}
      </span>
    </button>
  );
}

export function InlineSelect({
  value,
  onSave,
  options,
  className,
  display,
}: BaseProps & { options: Option[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onSave(e.target.value)}
      className={cn(
        "h-8 px-2 text-sm rounded border border-transparent bg-transparent hover:border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none cursor-pointer transition-colors",
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {display ? String(display(o.label)) : o.label}
        </option>
      ))}
    </select>
  );
}

export function InlineToggle({
  value,
  onSave,
  className,
}: {
  value: "Yes" | "No";
  onSave: (next: "Yes" | "No") => void;
  className?: string;
}) {
  const isYes = value === "Yes";
  return (
    <button
      onClick={() => onSave(isYes ? "No" : "Yes")}
      className={cn(
        "inline-flex items-center gap-2 select-none",
        className
      )}
    >
      <span
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors",
          isYes ? "bg-accent" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-all",
            isYes ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
      <span className={cn("text-xs font-medium", isYes ? "text-accent" : "text-muted-foreground")}>
        {value}
      </span>
    </button>
  );
}
