import { Construction } from "lucide-react";

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-[calc(100vh-2.5rem)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Construction className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          This module is on the roadmap. Hook it up when you're ready.
        </p>
      </div>
    </div>
  );
}
