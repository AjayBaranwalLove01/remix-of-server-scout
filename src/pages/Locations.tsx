import { useEffect, useState } from "react";
import { useMastersStore } from "@/store/mastersStore";
import { Plus, Pencil, Trash2, Save, X, MapPin, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { LocationMaster } from "@/types/masters";

export default function Locations() {
  const { locations, loaded, fetchAll, createLocation, updateLocation, deleteLocation } = useMastersStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftStatus, setDraftStatus] = useState<"Active" | "Inactive">("Active");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStatus, setNewStatus] = useState<"Active" | "Inactive">("Active");

  useEffect(() => { if (!loaded) fetchAll(); }, [loaded, fetchAll]);

  const startEdit = (l: LocationMaster) => {
    setEditing(l.id); setDraftName(l.location_name); setDraftStatus(l.status);
  };

  const saveEdit = async (id: string) => {
    const name = draftName.trim();
    if (!name) return toast.error("Location name required");
    if (locations.some((l) => l.id !== id && l.location_name.toLowerCase() === name.toLowerCase())) {
      return toast.error("Location already exists");
    }
    try {
      await updateLocation(id, { location_name: name, status: draftStatus });
      toast.success("Location updated"); setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return toast.error("Location name required");
    if (locations.some((l) => l.location_name.toLowerCase() === name.toLowerCase())) {
      return toast.error("Location already exists");
    }
    try {
      await createLocation({ location_name: name, status: newStatus });
      toast.success("Location added");
      setNewName(""); setNewStatus("Active"); setAdding(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (l: LocationMaster) => {
    if (!confirm(`Delete location "${l.location_name}"?`)) return;
    try { await deleteLocation(l.id); toast.success("Deleted"); }
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
              <MapPin className="w-6 h-6 text-primary" /> Locations Master
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage server locations. Only locations defined here can be used in server records.
            </p>
          </div>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-md bg-accent text-accent-foreground hover:bg-accent/90 font-medium">
            <Plus className="w-4 h-4" /> New location
          </button>
        </div>

        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr className="border-t border-border bg-accent/5">
                  <td className="px-4 py-3">
                    <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Sydney DC1"
                      className="h-8 px-2 text-sm rounded border border-accent bg-background outline-none focus:ring-2 focus:ring-accent/30 w-full" />
                  </td>
                  <td className="px-4 py-3">
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as any)}
                      className="h-8 px-2 text-sm rounded border border-border bg-card">
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={handleCreate} className="p-1.5 rounded text-success hover:bg-success/10"><Save className="w-4 h-4" /></button>
                      <button onClick={() => { setAdding(false); setNewName(""); }} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}
              {locations.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {editing === l.id ? (
                      <input value={draftName} onChange={(e) => setDraftName(e.target.value)}
                        className="h-8 px-2 text-sm rounded border border-accent bg-background w-full" />
                    ) : (
                      <span className="font-medium">{l.location_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === l.id ? (
                      <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as any)}
                        className="h-8 px-2 text-sm rounded border border-border bg-card">
                        <option>Active</option><option>Inactive</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{l.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {editing === l.id ? (
                        <>
                          <button onClick={() => saveEdit(l.id)} className="p-1.5 rounded text-success hover:bg-success/10"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditing(null)} className="p-1.5 rounded text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(l)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(l)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && !adding && (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">No locations yet. Click "New location" to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
