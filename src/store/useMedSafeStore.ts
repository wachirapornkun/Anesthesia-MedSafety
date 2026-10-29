import { useState, useEffect, useCallback } from 'react';
import {
  DailyPatientRecord,
  DrugAdministration,
  DrugItem,
  ErrorIncidentStatus,
  MedicationErrorReport,
  PatientCaseStatus,
  StaffMember,
  StockAuditLog,
  StockChangeType,
} from '../types';
import { buildInitialSeedData, getLocalDateString } from '../data/catalog';

const STORAGE_KEYS = {
  drugs: 'medsafe_v2_drugs',
  patients: 'medsafe_v2_daily_patients',
  administrations: 'medsafe_v2_administrations',
  staff: 'medsafe_v2_staff',
  errors: 'medsafe_v2_errors',
  logs: 'medsafe_v2_audit_logs',
  operator: 'medsafe_v2_active_operator',
  seededDate: 'medsafe_v2_seeded_date',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useMedSafeStore() {
  const [initialized, setInitialized] = useState(false);
  const [drugs, setDrugs] = useState<DrugItem[]>([]);
  const [dailyPatients, setDailyPatients] = useState<DailyPatientRecord[]>([]);
  const [administrations, setAdministrations] = useState<DrugAdministration[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [medicationErrors, setMedicationErrors] = useState<MedicationErrorReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>([]);
  const [activeOperatorName, setActiveOperatorName] = useState<string>('นพ. วชิรภรณ์ กิจประเสริฐ');

  useEffect(() => {
    const todayStr = getLocalDateString();
    const lastSeededDate = localStorage.getItem(STORAGE_KEYS.seededDate);
    const seed = buildInitialSeedData();

    if (!lastSeededDate) {
      setDrugs(seed.drugs);
      setDailyPatients(seed.dailyPatients);
      setAdministrations(seed.administrations);
      setStaffList(seed.staffList);
      setMedicationErrors(seed.medicationErrors);
      setAuditLogs(seed.auditLogs);
      localStorage.setItem(STORAGE_KEYS.seededDate, todayStr);
    } else {
      const savedDrugs = readStorage<DrugItem[]>(STORAGE_KEYS.drugs, seed.drugs);
      const savedPatients = readStorage<DailyPatientRecord[]>(
        STORAGE_KEYS.patients,
        seed.dailyPatients
      );
      const savedAdmins = readStorage<DrugAdministration[]>(
        STORAGE_KEYS.administrations,
        seed.administrations
      );
      const savedStaff = readStorage<StaffMember[]>(STORAGE_KEYS.staff, seed.staffList);
      const savedErrors = readStorage<MedicationErrorReport[]>(
        STORAGE_KEYS.errors,
        seed.medicationErrors
      );
      const savedLogs = readStorage<StockAuditLog[]>(STORAGE_KEYS.logs, seed.auditLogs);
      const savedOp = localStorage.getItem(STORAGE_KEYS.operator) || 'นพ. วชิรภรณ์ กิจประเสริฐ';

      setDrugs(savedDrugs);
      setDailyPatients(savedPatients);
      setAdministrations(savedAdmins);
      setStaffList(savedStaff);
      setMedicationErrors(savedErrors);
      setAuditLogs(savedLogs);
      setActiveOperatorName(savedOp);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.drugs, JSON.stringify(drugs));
      localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(dailyPatients));
      localStorage.setItem(STORAGE_KEYS.administrations, JSON.stringify(administrations));
      localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(staffList));
      localStorage.setItem(STORAGE_KEYS.errors, JSON.stringify(medicationErrors));
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.operator, activeOperatorName);
    } catch {
      // Ignore quota errors in restricted iframe contexts
    }
  }, [
    initialized,
    drugs,
    dailyPatients,
    administrations,
    staffList,
    medicationErrors,
    auditLogs,
    activeOperatorName,
  ]);

  // Register or update a daily patient record
  const saveDailyPatient = useCallback(
    (
      payload: Omit<DailyPatientRecord, 'id' | 'createdAt'> & { id?: string }
    ): DailyPatientRecord => {
      const normalizedHn = payload.hn.trim() || `HN-${Date.now().toString().slice(-5)}`;
      let savedRecord: DailyPatientRecord | null = null;

      setDailyPatients((prev) => {
        const existingIndex = payload.id
          ? prev.findIndex((p) => p.id === payload.id)
          : prev.findIndex(
              (p) =>
                p.dateString === payload.dateString &&
                p.hn.trim().toLowerCase() === normalizedHn.toLowerCase()
            );

        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const updated: DailyPatientRecord = {
            ...existing,
            ...payload,
            hn: normalizedHn,
          };
          savedRecord = updated;
          const next = [...prev];
          next[existingIndex] = updated;
          return next;
        }

        const created: DailyPatientRecord = {
          ...payload,
          hn: normalizedHn,
          id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        savedRecord = created;
        return [created, ...prev];
      });

      // Also sync patient demographic updates across administrations on the same date/patientId or HN
      if (payload.id) {
        setAdministrations((prev) =>
          prev.map((adm) => {
            if (
              adm.patientId === payload.id ||
              (adm.dateString === payload.dateString &&
                adm.hn.trim().toLowerCase() === normalizedHn.toLowerCase())
            ) {
              return {
                ...adm,
                patientName: payload.patientName,
                hn: normalizedHn,
                caseNumber: normalizedHn,
                patientAge: payload.age,
                patientWeightKg: payload.weightKg,
                asaClass: payload.asaClass,
                allergy: payload.allergy,
                operatingRoom: payload.operatingRoom,
                procedure: payload.procedure,
                anesthesiaType: payload.anesthesiaType,
              };
            }
            return adm;
          })
        );
      }

      return (
        savedRecord || {
          ...payload,
          hn: normalizedHn,
          id: `pt-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
      );
    },
    []
  );

  const updatePatientStatus = useCallback((patientId: string, status: PatientCaseStatus) => {
    setDailyPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status } : p))
    );
  }, []);

  const deleteDailyPatient = useCallback((patientId: string) => {
    setDailyPatients((prev) => prev.filter((p) => p.id !== patientId));
  }, []);

  // Record drug administration + link/create daily patient + deduct stock + create audit log
  const recordAdministration = useCallback(
    (
      input: Omit<DrugAdministration, 'id' | 'timestamp' | 'monthString'> & {
        timestamp?: string;
        caseStatus?: PatientCaseStatus;
      },
      linkedError?: Omit<MedicationErrorReport, 'id' | 'timestamp' | 'dateString'>
    ) => {
      const nowIso = input.timestamp || new Date().toISOString();
      const dateStr = input.dateString || getLocalDateString(new Date(nowIso));
      const monthStr = dateStr.slice(0, 7);
      const normalizedHn = input.hn.trim() || input.caseNumber.trim() || 'ไม่ระบุ HN';
      const normalizedName = input.patientName.trim() || 'ผู้ป่วยห้องผ่าตัด';

      // Upsert patient onto daily roster automatically
      let resolvedPatientId = input.patientId;
      setDailyPatients((prev) => {
        const idx = prev.findIndex(
          (p) =>
            (resolvedPatientId && p.id === resolvedPatientId) ||
            (p.dateString === dateStr &&
              p.hn.trim().toLowerCase() === normalizedHn.toLowerCase())
        );

        if (idx >= 0) {
          const existing = prev[idx];
          resolvedPatientId = existing.id;
          const updated: DailyPatientRecord = {
            ...existing,
            patientName: normalizedName,
            hn: normalizedHn,
            age: input.patientAge ?? existing.age,
            weightKg: input.patientWeightKg ?? existing.weightKg,
            asaClass: input.asaClass || existing.asaClass,
            allergy: input.allergy || existing.allergy,
            operatingRoom: input.operatingRoom || existing.operatingRoom,
            procedure: input.procedure || existing.procedure,
            anesthesiaType: input.anesthesiaType || existing.anesthesiaType,
            primaryStaffName: input.administratorName || existing.primaryStaffName,
            status:
              existing.status === 'scheduled'
                ? input.caseStatus || 'in_or'
                : input.caseStatus || existing.status,
          };
          const next = [...prev];
          next[idx] = updated;
          return next;
        }

        const newId = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        resolvedPatientId = newId;
        const created: DailyPatientRecord = {
          id: newId,
          dateString: dateStr,
          patientName: normalizedName,
          hn: normalizedHn,
          age: input.patientAge,
          weightKg: input.patientWeightKg,
          asaClass: input.asaClass || 'ASA II',
          allergy: input.allergy || 'ปฏิเสธแพ้ยา (NKDA)',
          operatingRoom: input.operatingRoom,
          procedure: input.procedure || 'หัตถการระงับความรู้สึกในห้องผ่าตัด',
          anesthesiaType: input.anesthesiaType || 'General Anesthesia with ETT (GA)',
          primaryStaffName: input.administratorName,
          status: input.caseStatus || 'in_or',
          scheduledTime: new Date(nowIso).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAt: nowIso,
        };
        return [created, ...prev];
      });

      const newAdmin: DrugAdministration = {
        ...input,
        id: `adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patientId: resolvedPatientId,
        patientName: normalizedName,
        hn: normalizedHn,
        caseNumber: normalizedHn,
        timestamp: nowIso,
        dateString: dateStr,
        monthString: monthStr,
      };

      setAdministrations((prev) => [newAdmin, ...prev]);

      // Update drug stock or multi-dose vial tracking
      setDrugs((prev) =>
        prev.map((d) => {
          if (d.id !== input.drugId) return d;
          const isMultiDose =
            d.isMultiDoseVial || d.name.toLowerCase().includes('ketamine');

          if (isMultiDose) {
            const cap = d.vialCapacity || 10;
            const nextUsed = parseFloat(
              ((d.activeVialUsed || 0) + input.usedDose + input.wastedDose).toFixed(2)
            );
            const nextRemaining = Math.max(0, parseFloat((cap - nextUsed).toFixed(2)));
            return {
              ...d,
              activeVialUsed: nextUsed,
              activeVialRemaining: nextRemaining,
              updatedAt: nowIso,
            };
          }

          const prevStock = d.stockCount;
          const nextStock = Math.max(0, prevStock - input.vialsOpened);

          if (input.vialsOpened > 0) {
            const newLog: StockAuditLog = {
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: nowIso,
              drugId: d.id,
              drugName: d.name,
              changeType: 'admin_deduct',
              quantityChange: -input.vialsOpened,
              previousStock: prevStock,
              newStock: nextStock,
              reason: `ใช้กับผู้ป่วย ${normalizedName} (${normalizedHn}) • ${input.operatingRoom}`,
              performedBy: input.administratorName || activeOperatorName,
              patientName: normalizedName,
              hn: normalizedHn,
            };
            setAuditLogs((logs) => [newLog, ...logs]);
          }

          return {
            ...d,
            stockCount: nextStock,
            updatedAt: nowIso,
          };
        })
      );

      if (linkedError) {
        const errReport: MedicationErrorReport = {
          ...linkedError,
          id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dateString: dateStr,
          timestamp: nowIso,
          patientName: normalizedName,
          hn: normalizedHn,
          caseNumber: normalizedHn,
        };
        setMedicationErrors((prev) => [errReport, ...prev]);
      }
    },
    [activeOperatorName]
  );

  // Return empty Ketamine 10ml vial and open/replenish from stock
  const resetMultiDoseVial = useCallback(
    (drugId: string) => {
      const nowIso = new Date().toISOString();
      setDrugs((prev) =>
        prev.map((d) => {
          if (d.id !== drugId) return d;
          const cap = d.vialCapacity || 10;
          const prevStock = d.stockCount;
          const nextStock = Math.max(0, prevStock - 1);

          const logEntry: StockAuditLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: nowIso,
            drugId: d.id,
            drugName: d.name,
            changeType: 'return',
            quantityChange: -1,
            previousStock: prevStock,
            newStock: nextStock,
            reason: `ส่งคืนขวดเปล่า Ketamine (ใช้สะสม ${d.activeVialUsed ?? 0} ml) และเปิดขวดใหม่ ${cap} ml`,
            performedBy: activeOperatorName,
          };
          setAuditLogs((logs) => [logEntry, ...logs]);

          return {
            ...d,
            stockCount: nextStock,
            activeVialUsed: 0,
            activeVialRemaining: cap,
            updatedAt: nowIso,
          };
        })
      );
    },
    [activeOperatorName]
  );

  // Add or update drug item in catalog
  const saveDrug = useCallback(
    (payload: Omit<DrugItem, 'id'> & { id?: string }) => {
      const nowIso = new Date().toISOString();
      if (payload.id) {
        setDrugs((prev) =>
          prev.map((d) =>
            d.id === payload.id
              ? { ...d, ...payload, id: d.id, updatedAt: nowIso, updatedBy: activeOperatorName }
              : d
          )
        );
      } else {
        const newDrug: DrugItem = {
          ...payload,
          id: `drug-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          updatedAt: nowIso,
          updatedBy: activeOperatorName,
        };
        setDrugs((prev) => [newDrug, ...prev]);
        setAuditLogs((logs) => [
          {
            id: `log-${Date.now()}`,
            timestamp: nowIso,
            drugId: newDrug.id,
            drugName: newDrug.name,
            changeType: 'restock',
            quantityChange: newDrug.stockCount,
            previousStock: 0,
            newStock: newDrug.stockCount,
            reason: 'เพิ่มรายการยาใหม่เข้าคลังวิสัญญี',
            performedBy: activeOperatorName,
          },
          ...logs,
        ]);
      }
    },
    [activeOperatorName]
  );

  // Restock or adjust stock count
  const adjustDrugStock = useCallback(
    (
      drugId: string,
      changeType: StockChangeType,
      amountOrTarget: number,
      reason: string
    ) => {
      const nowIso = new Date().toISOString();
      setDrugs((prev) =>
        prev.map((d) => {
          if (d.id !== drugId) return d;
          const prevStock = d.stockCount;
          const newStock =
            changeType === 'correction'
              ? Math.max(0, amountOrTarget)
              : Math.max(0, prevStock + amountOrTarget);
          const diff = newStock - prevStock;

          const logEntry: StockAuditLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: nowIso,
            drugId: d.id,
            drugName: d.name,
            changeType,
            quantityChange: diff,
            previousStock: prevStock,
            newStock,
            reason: reason.trim() || 'ปรับปรุงยอดสต็อกยา',
            performedBy: activeOperatorName,
          };
          setAuditLogs((logs) => [logEntry, ...logs]);

          return {
            ...d,
            stockCount: newStock,
            updatedAt: nowIso,
            updatedBy: activeOperatorName,
          };
        })
      );
    },
    [activeOperatorName]
  );

  // Staff management
  const addStaffMember = useCallback((member: Omit<StaffMember, 'id'>) => {
    const created: StaffMember = {
      ...member,
      id: `staff-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStaffList((prev) => [...prev, created]);
  }, []);

  const toggleStaffActive = useCallback((staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isActive: !s.isActive } : s))
    );
  }, []);

  const deleteStaffMember = useCallback((staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
  }, []);

  // Medication error reports
  const addMedicationError = useCallback(
    (payload: Omit<MedicationErrorReport, 'id' | 'timestamp'>) => {
      const created: MedicationErrorReport = {
        ...payload,
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      setMedicationErrors((prev) => [created, ...prev]);
    },
    []
  );

  const updateMedicationErrorStatus = useCallback(
    (errorId: string, status: ErrorIncidentStatus) => {
      setMedicationErrors((prev) =>
        prev.map((err) => (err.id === errorId ? { ...err, status } : err))
      );
    },
    []
  );

  return {
    initialized,
    drugs,
    dailyPatients,
    administrations,
    staffList,
    medicationErrors,
    auditLogs,
    activeOperatorName,
    setActiveOperatorName,
    saveDailyPatient,
    updatePatientStatus,
    deleteDailyPatient,
    recordAdministration,
    resetMultiDoseVial,
    saveDrug,
    adjustDrugStock,
    addStaffMember,
    toggleStaffActive,
    deleteStaffMember,
    addMedicationError,
    updateMedicationErrorStatus,
  };
}
