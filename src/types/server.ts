export type ServerStatus = "Active" | "Down" | "Maintenance";
export type Priority = "High" | "Medium" | "Low";
export type YesNo = "Yes" | "No";
export type Essential8 = "ML0" | "ML1" | "ML2" | "ML3";

export interface SupportGroup {
  id: string;
  name: string;
  manager: string;
  members: string[];
}

export interface AffectedGroup {
  groupId: string;
  selectedMembers: string[];
}

export interface Server {
  id?: string;
  sno: number;

  // General
  servername: string;
  serialnumber: string;
  ilo: string;
  location: string;
  sociAsset: string;
  pciAsset: string;
  model: string;
  dnsip: string;
  os: string;
  osSupportEnds: string; // ISO date
  internetFacing: YesNo;
  status: ServerStatus;
  network: string;
  sdomain: string;
  isPatched: YesNo;
  essential8: Essential8;

  // Summary
  buildDate: string;
  businessFunction: string;
  patchSequence: string;
  maintenanceComment: string;
  day: string;
  time: string;
  buildEngineer: string;
  serverDescription: string;
  alive: YesNo;
  lastCollated: string; // ISO timestamp
  priority: Priority;
  patchCategory: string;
  notes: string;
  softwareInstalledUrl: string;
  backupDetailsUrl: string;

  // Patching
  patchContact: string;
  patchNotes: string;
  designEngineer: string;

  // Support
  primaryGroupId: string;
  affectedGroups: AffectedGroup[];

  updatedAt: string;
}
