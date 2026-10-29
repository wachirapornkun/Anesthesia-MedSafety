export type DrugCategory =
  | 'opioid'
  | 'muscle_relaxant'
  | 'local_anesthetic'
  | 'had'
  | 'inhalation'
  | 'general';

export type DrugUnit = 'mg' | 'mcg' | 'ml' | 'units';

export type StaffRole =
  | 'anesthesiologist'
  | 'nurse_anesthetist'
  | 'pharmacist'
  | 'nurse';

export type PatientCaseStatus =
  | 'scheduled'
  | 'in_or'
  | 'pacu'
  | 'completed';

export type NccMerpSeverity =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I';

export type ErrorIncidentStatus = 'reported' | 'reviewed' | 'resolved';

export type StockChangeType =
  | 'admin_deduct'
  | 'restock'
  | 'return'
  | 'correction';

export type AppTab =
  | 'daily'
  | 'inventory'
  | 'monthly'
  | 'analytics'
  | 'safety';

export interface DrugItem {
  id: string;
  name: string;
  genericName: string;
  category: DrugCategory;
  subCategory?: string;
  unit: DrugUnit;
  concentration: string;
  standardVialDose: number;
  stockCount: number;
  minAlertStock: number;
  lotNumber?: string;
  expiryDate?: string;
  isHighAlert: boolean;
  isHad: boolean;
  isMultiDoseVial?: boolean;
  vialCapacity?: number;
  activeVialUsed?: number;
  activeVialRemaining?: number;
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface DailyPatientRecord {
  id: string;
  dateString: string; // YYYY-MM-DD
  patientName: string;
  hn: string;
  an?: string;
  age?: number;
  weightKg?: number;
  gender?: 'ชาย' | 'หญิง';
  asaClass: string;
  allergy: string;
  operatingRoom: string;
  procedure: string;
  anesthesiaType: string;
  primaryStaffName: string;
  status: PatientCaseStatus;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
}

export interface DrugAdministration {
  id: string;
  drugId: string;
  drugName: string;
  category: DrugCategory;
  unit: DrugUnit;
  vialsOpened: number;
  totalOpenedDose: number;
  usedDose: number;
  wastedDose: number;
  wastageReason: string;
  disposalMethod: string;
  operatingRoom: string;
  caseNumber: string; // HN or Case ID
  patientId?: string;
  patientName: string;
  hn: string;
  patientAge?: number;
  patientWeightKg?: number;
  asaClass?: string;
  allergy?: string;
  procedure?: string;
  anesthesiaType?: string;
  administratorName: string;
  administratorRole: string;
  witnessName: string;
  witnessRole: string;
  safetyChecked: boolean;
  isHad: boolean;
  isHighAlert: boolean;
  recordedByEmail: string;
  timestamp: string;
  dateString: string; // YYYY-MM-DD
  monthString: string; // YYYY-MM
  hasMedicationError?: boolean;
  errorSeverityLevel?: NccMerpSeverity;
  errorNote?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  licenseNumber: string;
  department: string;
  isActive: boolean;
  createdAt?: string;
}

export interface MedicationErrorReport {
  id: string;
  dateString: string;
  timestamp: string;
  drugId: string;
  drugName: string;
  category: DrugCategory;
  severityLevel: NccMerpSeverity;
  errorType: string;
  description: string;
  operatingRoom: string;
  caseNumber?: string;
  patientName?: string;
  hn?: string;
  discoveredBy: string;
  reportedBy: string;
  correctiveAction: string;
  preventiveAction: string;
  status: ErrorIncidentStatus;
}

export interface StockAuditLog {
  id: string;
  timestamp: string;
  drugId: string;
  drugName: string;
  changeType: StockChangeType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  patientName?: string;
  hn?: string;
}
