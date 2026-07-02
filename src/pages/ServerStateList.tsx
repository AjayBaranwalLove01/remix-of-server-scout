import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TopBar } from "@/components/inventory/TopBar";
import { useServerStore } from "@/store/serverStore";
import { rowToServer } from "@/lib/serverMapper";
import { Server } from "@/types/server";
import {
  Download,
  Loader2,
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function ServerStateList() {
  const { state } = useParams<{ state: string }>();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("scout_token");

  // Map route state key to database status filter values
  const getStateLabel = () => {
    switch (state) {
      case "production":
        return "Production";
      case "non-production":
        return "Non Production";
      case "build":
        return "Build";
      case "pre-production":
        return "Pre-Production";
      case "decommissioned":
        return "Decommissioned";
      default:
        return state || "";
    }
  };

  useEffect(() => {
    const fetchStateServers = async () => {
      setLoading(true);
      try {
        const queryLabel = getStateLabel();
        const res = await fetch(`/api/servers?status=${encodeURIComponent(queryLabel)}&pageSize=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error("Failed to fetch servers");
        const data = await res.json();
        const mapped = (data.data || []).map(rowToServer);
        setServers(mapped);
      } catch (err: any) {
        toast.error(`Error: ${err.message || "Failed to load servers"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStateServers();
  }, [state, token]);

  const filteredServers = servers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.servername.toLowerCase().includes(term) ||
      s.serialnumber.toLowerCase().includes(term) ||
      (s.dnsip && s.dnsip.toLowerCase().includes(term)) ||
      (s.location && s.location.toLowerCase().includes(term)) ||
      (s.os && s.os.toLowerCase().includes(term)) ||
      (s.model && s.model.toLowerCase().includes(term)) ||
      (s.primaryAssigneeManager && s.primaryAssigneeManager.toLowerCase().includes(term)) ||
      (s.businessFunction && s.businessFunction.toLowerCase().includes(term))
    );
  });

  const handleExportExcel = () => {
    if (filteredServers.length === 0) {
      toast.error("No server records to export.");
      return;
    }

    const headers = [
      "Server Name",
      "Serial Number",
      "IP Address",
      "Site",
      "Operating System",
      "Model",
      "Status",
      "Primary Assignee Manager",
      "iLO Address",
      "Ping Check",
      "Business Function"
    ];

    const rows = filteredServers.map((s) => [
      s.servername,
      s.serialnumber || "",
      s.dnsip || "",
      s.location || "",
      s.os || "",
      s.model || "",
      s.status || "",
      s.primaryAssigneeManager || "",
      s.ilo || "",
      s.ping || "",
      s.businessFunction || ""
    ]);

    // Build Excel XML spreadsheet simulation format
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    tableHtml += `<head><meta charset="utf-8" /><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Servers</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    tableHtml += `<body style="font-family: sans-serif; padding: 10px;"><h2 style="margin-bottom: 5px;">Server State Inventory - ${getStateLabel()}</h2><p style="margin-top: 0; color: #555;">Exported on: ${new Date().toLocaleString()}</p><table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;">`;
    
    // Headers Row
    tableHtml += `<tr style="background-color: #0f172a; color: #ffffff;">` + headers.map(h => `<th style="padding:8px; text-align:left; font-weight:bold;">${h}</th>`).join('') + `</tr>`;
    
    // Server Rows
    rows.forEach(row => {
      tableHtml += `<tr>` + row.map(cell => `<td style="padding:6px; border:1px solid #cbd5e1;">${String(cell ?? "")}</td>`).join('') + `</tr>`;
    });
    
    tableHtml += `</table></body></html>`;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servers_${state || "list"}_${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel sheet downloaded successfully!");
  };

  const renderPing = (pingVal?: string) => {
    const val = String(pingVal ?? "").trim().toLowerCase();
    if (val === "yes" || val === "ok" || val === "1") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" /> Online
        </span>
      );
    } else if (val === "no" || val === "0" || val === "error") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
          <XCircle className="w-3.5 h-3.5" /> Offline
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" /> {pingVal || "Unknown"}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                to="/"
                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h2 className="text-2xl font-bold text-foreground tracking-tight capitalize">
                {getStateLabel()} Servers
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Total {filteredServers.length} servers found in state: {getStateLabel()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Export to Excel
            </button>
          </div>
        </div>

        {/* Toolbar filter */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-muted/30 border border-border max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search state servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground text-foreground"
          />
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Server Name</th>
                    <th className="px-4 py-3">Serial Number</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3">OS</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assignee Manager</th>
                    <th className="px-4 py-3">iLO</th>
                    <th className="px-4 py-3">Ping</th>
                    <th className="px-4 py-3">Business Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredServers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-12 text-muted-foreground">
                        No servers found matching state "{getStateLabel()}".
                      </td>
                    </tr>
                  ) : (
                    filteredServers.map((s) => (
                      <tr
                        key={s.sno}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-bold text-foreground">
                          {s.servername}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.serialnumber || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.dnsip || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.location || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.os || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.model || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center text-xs font-semibold text-foreground px-2 py-0.5 rounded bg-muted">
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.primaryAssigneeManager || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {s.ilo || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {renderPing(s.ping)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground max-w-xs truncate">
                          {s.businessFunction || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
