import { useEffect, useState } from "react";
import { useMastersStore } from "@/store/mastersStore";
import { Plus, Pencil, Trash2, Save, X, Monitor, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { OsMaster } from "@/types/masters";

export default function OsCatalog() {
  const { os, loaded, fetchAll, createOs, updateOs, deleteOs } = useMastersStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ os_name: "", os_support_end_date: "", status: "Active" as "Active" | "Inactive" });
  const [adding, setAdding] = useState(false);
  const [n, setN] = useState({ os_name: "", os_support_end_date: "", status: "Active" as "Active" | "Inactive" });

  useEffect(() => { if (!loaded) fetchAll(); }, [loaded, fetchAll]);

  const startEdit = (o: OsMaster) => {
    setEditing(o.id);
    setDraft({ os_name: o.os_name, os_support_end_date: o.os_support_end_date, status: o.status });
  };

  const saveEdit = async (id: string) => {
    const name = draft.os_name.trim();
    if (!name) return toast.error("OS name required");
    if (os.some((o) => o.id !== id && o.os_name.toLowerCase() === name.toLowerCase())) {
      return toast.error("OS already exists");
    }
    try {
      await updateOs(id, { os_name: name, os_support_end_date: draft.os_support_end_date, status: draft.status });
      toast.success("OS updated"); setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreate = async () => {
    const name = n.os_name.trim();
    if (!name) return toast.error("OS name required");
    if (os.some((o) => o.os_name.toLowerCase() === name.toLowerCase())) {
      return toast.error("OS already exists");
    }
    try {
      await createOs({ os_name: name, os_support_end_date: n.os_support_end_date, status: n.status });
      toast.success("OS added");
      setN({ os_name: "", os_support_end_date: "", status: "Active" }); setAdding(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (o: OsMaster) => {
    if (!confirm(`Delete OS "${o.os_name}"?`)) return;
    try { await deleteOs(o.id); toast.success("Deleted"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Inventory
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-2 flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary" /> OS Master
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage Operating Systems. Support end date auto-fills on server records when an OS is selected.
            </p>
          </div>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md bg-accent text-accent-foreground hover:bg-accent/90 font-medium">
            <Plus className="w-4 h-4" /> New OS
          </button>
        </div>

        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">OS Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support End Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr className="border-t border-border bg-accent/5">
                  <td className="px-4 py-3">
                    <input autoFocus value={n.os_name} onChange={(e) => setN({ ...n, os_name: e.target.value })}
                      placeholder="e.g. Windows Server 2025"
                      className="h-8 px-2 text-sm rounded border border-accent bg-background w-full" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="date" value={n.os_support_end_date} onChange={(e) => setN({ ...n, os_support_end_date: e.target.value })}
                      className="h-8 px-2 text-sm rounded border border-border bg-card" />
                  </td>
                  <td className="px-4 py-3">
                    <select value={n.status} onChange={(e) => setN({ ...n, status: e.target.value as any })}
                      className="h-8 px-2 text-sm rounded border border-border bg-card">
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={handleCreate} className="p-1.5 rounded text-success hover:bg-success/10"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setAdding(false)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}
              {os.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {editing === o.id ? (
                      <input value={draft.os_name} onChange={(e) => setDraft({ ...draft, os_name: e.target.value })}
                        className="h-8 px-2 text-sm rounded border border-accent bg-background w-full" />
                    ) : (
                      <span className="font-medium">{o.os_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {editing === o.id ? (
                      <input type="date" value={draft.os_support_end_date} onChange={(e) => setDraft({ ...draft, os_support_end_date: e.target.value })}
                        className="h-8 px-2 text-sm rounded border border-border bg-card" />
                    ) : (
                      o.os_support_end_date || <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === o.id ? (
                      <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as any })}
                        className="h-8 px-2 text-sm rounded border border-border bg-card">
                        <option>Active</option><option>Inactive</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{o.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {editing === o.id ? (
                        <>
                          <button onClick={() => saveEdit(o.id)} className="p-1.5 rounded text-success hover:bg-success/10"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditing(null)} className="p-1.5 rounded text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(o)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(o)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {os.length === 0 && !adding && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">No OS entries yet. Click "New OS" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
