import type { Server } from "@/types/server";
import type { LocationMaster, OsMaster } from "@/types/masters";

export interface ValidationContext {
  servers: Server[];
  locations: LocationMaster[];
  os: OsMaster[];
  selfId?: string;
}

export type ValidationErrors = Partial<Record<keyof Server, string>>;

const YES_NO = new Set(["Yes", "No"]);

export function validateServer(
  next: Partial<Server>,
  ctx: ValidationContext
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (next.servername !== undefined) {
    const name = next.servername.trim();
    if (!name) errors.servername = "Server name is required.";
    else if (name.length > 100) errors.servername = "Server name must be 100 characters or fewer.";
    else {
      const dup = ctx.servers.find(
        (s) => s.servername.toLowerCase() === name.toLowerCase() && s.id !== ctx.selfId
      );
      if (dup) errors.servername = "Server name already exists.";
    }
  }

  if (next.pciAsset !== undefined && !YES_NO.has(next.pciAsset)) {
    errors.pciAsset = "PCI Asset must be Yes or No.";
  }
  if (next.sociAsset !== undefined && !YES_NO.has(next.sociAsset)) {
    errors.sociAsset = "SOCI Asset must be Yes or No.";
  }

  if (next.location !== undefined && next.location.trim()) {
    const exists = ctx.locations.some(
      (l) => l.status === "Active" && l.location_name.toLowerCase() === next.location!.trim().toLowerCase()
    );
    if (!exists) errors.location = "Location must be selected from the Locations master.";
  }

  if (next.os !== undefined && next.os.trim()) {
    const exists = ctx.os.some(
      (o) => o.status === "Active" && o.os_name.toLowerCase() === next.os!.trim().toLowerCase()
    );
    if (!exists) errors.os = "OS must be selected from the OS master.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors) {
  return Object.keys(errors).length > 0;
}
