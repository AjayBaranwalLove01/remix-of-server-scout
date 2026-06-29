import { Fragment, type ReactNode } from "react";

export function highlightMatch(text: string, term: string): ReactNode {
  const value = String(text ?? "");
  const q = term.trim();
  if (!q) return value;
  const idx = value.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return value;
  const before = value.slice(0, idx);
  const match = value.slice(idx, idx + q.length);
  const after = value.slice(idx + q.length);
  return (
    <Fragment>
      {before}
      <mark className="bg-accent/30 text-accent-foreground rounded-sm px-0.5">
        {match}
      </mark>
      {after}
    </Fragment>
  );
}
