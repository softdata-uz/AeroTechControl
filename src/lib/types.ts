// Domain models for the Airport Screening Equipment Accounting,
// Control and Maintenance System. Equipment is the central entity;
// every other entity references it directly or indirectly.

export type EquipmentStatus =
  | "operational"
  | "maintenance"
  | "faulty"
  | "reserve"
  | "requires_inspection"
  | "decommissioned";

export type InspectionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "overdue"
  | "requires_review";

export type FaultStage =
  | "detected"
  | "registered"
  | "assigned"
  | "diagnosis"
  | "repair"
  | "verification"
  | "closed";

export type FaultPriority = "low" | "medium" | "high" | "critical";

export type RepairStatus =
  | "planned"
  | "in_progress"
  | "waiting_parts"
  | "completed"
  | "verified";

export type DocumentStatus = "draft" | "active" | "expiring" | "expired" | "archived";

export type SparePartStatus = "available" | "low_stock" | "reserved" | "out_of_stock";

export type ChecklistResult = "compliant" | "non_compliant" | "not_applicable" | "pending";

export interface ChecklistItem {
  id: string;
  label: string;
  result: ChecklistResult;
  comment?: string;
}

export interface Airport {
  id: string;
  name: string;
  code: string;
  city: string;
}

export interface Terminal {
  id: string;
  airportId: string;
  name: string;
}

export interface Zone {
  id: string;
  terminalId: string;
  name: string;
}

export interface Equipment {
  id: string;
  code: string; // e.g. EQ-0001
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  inventoryNumber: string;
  airportId: string;
  terminalId: string;
  zoneId: string;
  location: string;
  status: EquipmentStatus;
  commissionedAt: string; // ISO date
  lastInspectionAt: string | null;
  nextInspectionAt: string | null;
  imageColor: string; // accent color for the generated equipment glyph
}

export interface Inspection {
  id: string; // e.g. INS-00123
  equipmentId: string;
  type: "periodic" | "unscheduled" | "post_repair";
  regulation: string;
  status: InspectionStatus;
  scheduledAt: string;
  completedAt: string | null;
  inspector: string;
  result: "compliant" | "non_compliant" | "pending" | null;
}

export type FaultDetectedVia = "inspection" | "manual" | "sensor" | "audit";

export interface Fault {
  id: string; // e.g. INC-00032
  equipmentId: string;
  title: string;
  description: string;
  category: string;
  priority: FaultPriority;
  stage: FaultStage;
  detectedAt: string;
  detectedVia: FaultDetectedVia;
  dueAt: string | null;
  reportedBy: string;
  assignee: string | null;
  attachmentCount: number;
}

export interface Repair {
  id: string; // e.g. REP-00045
  faultId: string;
  equipmentId: string;
  status: RepairStatus;
  engineer: string;
  startedAt: string;
  completedAt: string | null;
  estimatedHours: number;
  actualHours: number | null;
  partsUsed: string[];
  verificationResult: "passed" | "failed" | null;
}

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  stock: number;
  minStock: number;
  reserved: number;
  status: SparePartStatus;
  compatibleEquipmentTypes: string[];
}

export interface EquipmentDocument {
  id: string;
  equipmentId: string | null;
  title: string;
  type: "certificate" | "act" | "protocol" | "manual" | "repair_report";
  status: DocumentStatus;
  author: string;
  date: string;
  version: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
  entityType: "equipment" | "fault" | "inspection" | "spare_part";
  entityId: string;
  read: boolean;
}

export type UserRole =
  | "engineer"
  | "lead_engineer"
  | "spare_parts_manager"
  | "central_office"
  | "administrator"
  | "auditor";

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  airportId: string | null;
  active: boolean;
  lastActiveAt: string;
}
