import type { Server, AffectedGroup, SupportGroup, ServerStatus, Priority, YesNo, Essential8 } from "@/types/server";

function idToSno(id: unknown): number {
  const text = String(id ?? "");
  const numericSuffix = text.match(/(\d+)$/)?.[1];
  if (numericSuffix) return Number(numericSuffix);
  return Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

// Maps a DetailAllServers row → app Server
export function rowToServer(r: any): Server {
  let affected: AffectedGroup[] = [];
  
  // Safely handle AffectedGroups from SQL Server (as JSON string or array)
  const rawAffected = r.AffectedGroups ?? r.affected_groups;
  if (Array.isArray(rawAffected)) {
    affected = rawAffected;
  } else if (typeof rawAffected === "string" && rawAffected.trim()) {
    try {
      affected = JSON.parse(rawAffected);
    } catch {
      affected = [];
    }
  }

  // Decommissioned -> alive mapping
  const isDecom = r.Decommissioned ?? r.decommissioned;
  const aliveVal: YesNo = (isDecom === "Yes" || r.Status === "Decommissioned") ? "No" : "Yes";

  return {
    id: String(r.sdbID ?? r.id ?? ""),
    sno: Number(r.sdbID ?? r.sno ?? idToSno(r.sdbID || r.id)),
    servername: r.Servername ?? r.server_name ?? r.servername ?? "",
    serialnumber: r.SerialNumber ?? r.serial_number ?? r.serialnumber ?? "",
    ilo: r.ManagementIP ?? r.ilo ?? "",
    location: r.LOCATIONNAME ?? r.location ?? "",
    sociAsset: (r.SOCIAsset ?? r.soci_asset ?? "No") as YesNo,
    pciAsset: (r.PCIAsset ?? r.pci_asset ?? "No") as YesNo,
    model: r.Model ?? r.model ?? "",
    dnsip: r.DNSIP ?? r.ip_address ?? r.dnsip ?? "",
    os: r.OSName ?? r.os ?? "",
    osSupportEnds: r.OSSupportEnds ?? r.os_support_ends ?? r.os_support_end_date ?? "",
    internetFacing: (r.InternetFacing ?? r.internet_facing ?? "No") as YesNo,
    status: (r.Status ?? r.status ?? "Active") as ServerStatus,
    network: r.zone ?? r.Zone ?? r.network ?? "",
    sdomain: r.sDomain ?? r.domain ?? r.sdomain ?? "",
    isPatched: (r.IsPatched ?? r.is_patched ?? "No") as YesNo,
    essential8: (r.Essential8 ?? r.essential8 ?? "No") as YesNo,
    buildDate: r.BuildDate ?? r.build_date ?? "",
    businessFunction: r.BusinessFunction ?? r.businessfunction ?? r.business_function ?? "",
    patchSequence: r.PatchSequence ?? r.patchsequence ?? r.patch_sequence ?? "",
    maintenanceComment: r.MaintenanceWindowComment ?? r.maintenance_comment ?? "",
    day: r.MaintenanceDayNew ?? r.maintenancedaynew ?? r.MaintenanceDay ?? r.day ?? "",
    time: r.MaintenanceTimeNew ?? r.maintenancetimenew ?? r.MaintenanceTime ?? r.time ?? "",
    buildEngineer: r.BuildEngineer ?? r.build_engineer ?? "",
    serverDescription: r.Description ?? r.server_description ?? "",
    alive: aliveVal,
    lastCollated: r.SummaryRecordUpdate ?? r.last_collated ?? new Date().toISOString(),
    priority: (
      r.Priority === 1 || r.Priority === "1" || String(r.Priority).toLowerCase() === "high" ? "High" :
      r.Priority === 3 || r.Priority === "3" || String(r.Priority).toLowerCase() === "low" ? "Low" : "Medium"
    ) as Priority,
    patchCategory: r.PatchCategory ?? r.patchcategory ?? r.patch_category ?? "",
    notes: r.notes ?? r.notes ?? "",
    softwareInstalledUrl: r.software_installed_url ?? r.softwareInstalledUrl ?? "",
    backupDetailsUrl: r.backup_details_url ?? r.backupDetailsUrl ?? "",
    patchContact: r.Contact ?? r.patch_contact ?? "",
    patchNotes: r.patch_notes ?? r.patchNotes ?? "",
    designEngineer: r.ProjEng ?? r.design_engineer ?? "",
    primaryGroupId: r.primary_group_id ?? r.primaryGroupId ?? "",
    affectedGroups: affected,
    updatedAt: r.RecordUpdate ?? r.updated_at ?? new Date().toISOString(),
  };
}

// Splits server fields (backward compatibility helper)
export function splitPatch(p: Partial<Server>): {
  general: Record<string, any>;
  summary: Record<string, any>;
} {
  const general: Record<string, any> = {};
  const summary: Record<string, any> = {};
  return { general, summary };
}

export function patchToRow(p: Partial<Server>): Record<string, any> {
  return p;
}

export function rowToGroup(r: any): SupportGroup {
  return { 
    id: r.id ?? r.ID, 
    name: r.name ?? r.Name, 
    manager: r.manager ?? r.Manager, 
    members: Array.isArray(r.members) ? r.members : (typeof r.Members === "string" ? JSON.parse(r.Members) : [])
  };
}

export function emptyServer(sno: number): Server {
  return {
    sno,
    servername: "NEW-SERVER",
    serialnumber: "",
    ilo: "",
    location: "",
    sociAsset: "No",
    pciAsset: "No",
    model: "",
    dnsip: "",
    os: "Windows Server 2022",
    osSupportEnds: "",
    internetFacing: "No",
    status: "Active",
    network: "",
    sdomain: "",
    isPatched: "No",
    essential8: "ML0",
    buildDate: "",
    businessFunction: "",
    patchSequence: "",
    maintenanceComment: "",
    day: "",
    time: "",
    buildEngineer: "",
    serverDescription: "",
    alive: "Yes",
    lastCollated: new Date().toISOString(),
    priority: "Medium",
    patchCategory: "",
    notes: "",
    softwareInstalledUrl: "",
    backupDetailsUrl: "",
    patchContact: "",
    patchNotes: "",
    designEngineer: "",
    primaryGroupId: "",
    affectedGroups: [],
    updatedAt: new Date().toISOString(),
  };
}
