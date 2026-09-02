// Domain models for the Airport Screening Equipment Accounting,
// Control and Maintenance System. Equipment is the central entity;
// every other entity references it directly or indirectly.

export type EquipmentStatus =
  | "faulty"
  | "operational"
  | "good"
  | "satisfactory"
  | "unsatisfactory"
  | "overdue"
  | "not_connected";

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
  id: number;
  label: string;
  result: ChecklistResult;
  comment?: string;
}

export interface Airport {
  id: number;
  name: string;
  code: string;
  city: string;
}

export interface Terminal {
  id: number;
  airportId: number;
  name: string;
}

export interface Zone {
  id: number;
  terminalId: number;
  name: string;
}

export interface LookupRef {
  id: number;
  name: string;
}

export interface EquipmentType {
  id: number;
  name: string;
}

export interface EquipmentModel {
  id: number;
  equipmentTypeId: number;
  name: string;
}

export interface ManufacturerCompany {
  id: number;
  name: string;
}

export interface ManufacturerCountry {
  id: number;
  name: string;
}

export interface EquipmentOperator {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  code: string; // e.g. EQ-0001
  name: string;
  equipmentType: LookupRef;
  equipmentModel: LookupRef;
  manufacturerCompany: LookupRef;
  manufacturerCountry: LookupRef;
  serialNumber: string;
  inventoryNumber: string | null;
  airport: Airport;
  terminal: LookupRef | null;
  zone: LookupRef | null;
  location: string | null;
  operatedBy: LookupRef;
  status: EquipmentStatus;
  manufactureYear: number;
  purchaseYear: number | null;
  commissioningYear: number | null;
  serviceLifeExpiryYear: number | null;
  lastInspectionAt: string | null;
  nextInspectionAt: string | null;
  image: string | null;
  imageUrl: string | null;
  notes: string | null;
}

export interface Inspection {
  id: number;
  equipmentId: number;
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
  id: number;
  code: string; // e.g. INC-00032
  equipmentId: number;
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
  id: number;
  faultId: number;
  equipmentId: number;
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
  id: number;
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
  code: string; // e.g. doc-001
  equipmentId: number | null;
  title: string;
  type: "certificate" | "act" | "protocol" | "manual" | "repair_report";
  status: DocumentStatus;
  author: string;
  date: string;
  version: string;
  fileUrl: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
  entityType: "equipment" | "fault" | "inspection" | "spare_part";
  entityId: number;
  read: boolean;
}

export type UserRole =
  | "king"
  | "engineer"
  | "lead_engineer"
  | "spare_parts_manager"
  | "central_office"
  | "administrator"
  | "auditor";

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  airportId: number | null;
  active: boolean;
  lastActiveAt: string | null;
}
