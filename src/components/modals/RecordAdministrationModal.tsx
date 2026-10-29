import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Syringe,
  UserCheck,
  X,
} from 'lucide-react';
import {
  DailyPatientRecord,
  DrugAdministration,
  DrugCategory,
  DrugItem,
  MedicationErrorReport,
  NccMerpSeverity,
  StaffMember,
} from '../../types';
import {
  ANESTHESIA_TYPES,
  ASA_CLASSES,
  DISPOSAL_METHODS,
  ERROR_TYPES,
  getLocalDateString,
  isHadDrug,
  NCC_MERP_LEVELS,
  OPERATING_ROOMS,
  WASTAGE_REASONS,
} from '../../data/catalog';
import {
  AggregatedDailyPatient,
  buildAggregatedDailyPatients,
} from '../DailyPatientRosterPanel';

interface RecordAdministrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugs: DrugItem[];
  staffList: StaffMember[];
  dailyPatients: DailyPatientRecord[];
  administrations: DrugAdministration[];
  selectedDate: string;
  preselectedDrugId?: string | null;
  preselectedPatient?: AggregatedDailyPatient | null;
  activeOperatorName: string;
  onOpenStaffModal: () => void;
  onSubmitAdministration: (
    payload: Omit<DrugAdministration, 'id' | 'timestamp' | 'monthString'> & {
      timestamp?: string;
    },
    linkedError?: Omit<MedicationErrorReport, 'id' | 'timestamp' | 'dateString'>
  ) => void;
}

export const RecordAdministrationModal: React.FC<RecordAdministrationModalProps> = ({
  isOpen,
  onClose,
  drugs,
  staffList,
  dailyPatients,
  administrations,
  selectedDate,
  preselectedDrugId,
  preselectedPatient,
  activeOperatorName,
  onOpenStaffModal,
  onSubmitAdministration,
}) => {
  const [dateString, setDateString] = useState(selectedDate || getLocalDateString());

  // Patient fields
  const [patientId, setPatientId] = useState<string | undefined>(undefined);
  const [patientName, setPatientName] = useState('');
  const [hn, setHn] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientWeightKg, setPatientWeightKg] = useState('');
  const [asaClass, setAsaClass] = useState('ASA II');
  const [allergy, setAllergy] = useState('ปฏิเสธแพ้ยา (NKDA)');
  const [operatingRoom, setOperatingRoom] = useState(OPERATING_ROOMS[0]);
  const [procedure, setProcedure] = useState('');
  const [anesthesiaType, setAnesthesiaType] = useState(ANESTHESIA_TYPES[0]);

  // Medication fields
  const [catFilter, setCatFilter] = useState<'all' | DrugCategory>('all');
  const [selectedDrugId, setSelectedDrugId] = useState('');
  const [vialsOpened, setVialsOpened] = useState(1);
  const [usedDose, setUsedDose] = useState('');
  const [wastedDose, setWastedDose] = useState('0');
  const [wastageReason, setWastageReason] = useState(WASTAGE_REASONS[0]);
  const [disposalMethod, setDisposalMethod] = useState(DISPOSAL_METHODS[0]);

  // Staff & Safety
  const [administratorName, setAdministratorName] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [sixRights, setSixRights] = useState({
    patient: true,
    drug: true,
    dose: true,
    route: true,
    time: true,
    witness: true,
  });

  // Optional Med Error
  const [hasMedError, setHasMedError] = useState(false);
  const [errorSeverity, setErrorSeverity] = useState<NccMerpSeverity>('B');
  const [errorType, setErrorType] = useState(ERROR_TYPES[0].value);
  const [errorNote, setErrorNote] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  const activeStaff = useMemo(
    () => staffList.filter((s) => s.isActive),
    [staffList]
  );

  const patientsOnSelectedDate = useMemo(
    () => buildAggregatedDailyPatients(dateString, dailyPatients, administrations),
    [dateString, dailyPatients, administrations]
  );

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setDateString(selectedDate || getLocalDateString());

    if (preselectedDrugId) {
      setSelectedDrugId(preselectedDrugId);
      setCatFilter('all');
    } else if (drugs.length > 0 && !selectedDrugId) {
      setSelectedDrugId(drugs[0].id);
    }

    if (preselectedPatient) {
      setPatientId(preselectedPatient.patientRecord?.id);
      setPatientName(preselectedPatient.patientName);
      setHn(preselectedPatient.hn);
      setPatientAge(
        preselectedPatient.age !== undefined ? String(preselectedPatient.age) : ''
      );
      setPatientWeightKg(
        preselectedPatient.weightKg !== undefined
          ? String(preselectedPatient.weightKg)
          : ''
      );
      setAsaClass(preselectedPatient.asaClass || 'ASA II');
      setAllergy(preselectedPatient.allergy || 'ปฏิเสธแพ้ยา (NKDA)');
      setOperatingRoom(preselectedPatient.operatingRoom || OPERATING_ROOMS[0]);
      setProcedure(preselectedPatient.procedure || '');
      setAnesthesiaType(preselectedPatient.anesthesiaType || ANESTHESIA_TYPES[0]);
    } else {
      setPatientId(undefined);
      setPatientName('');
      setHn('');
      setPatientAge('');
      setPatientWeightKg('');
      setAsaClass('ASA II');
      setAllergy('ปฏิเสธแพ้ยา (NKDA)');
      setOperatingRoom(OPERATING_ROOMS[0]);
      setProcedure('');
      setAnesthesiaType(ANESTHESIA_TYPES[0]);
    }

    setVialsOpened(1);
    setUsedDose('');
    setWastedDose('0');
    setHasMedError(false);
    setErrorNote('');

    const defaultAdmin =
      activeStaff.find((s) => s.name === activeOperatorName)?.name ||
      activeStaff[0]?.name ||
      activeOperatorName;
    setAdministratorName(defaultAdmin);

    const defaultWitness =
      activeStaff.find((s) => s.name !== defaultAdmin)?.name || '';
    setWitnessName(defaultWitness);
  }, [
    isOpen,
    preselectedDrugId,
    preselectedPatient,
    selectedDate,
    drugs,
    activeStaff,
    activeOperatorName,
  ]);

  const filteredDrugs = useMemo(() => {
    return drugs.filter((d) => {
      if (catFilter === 'all') return true;
      if (catFilter === 'had') return d.category === 'had' || isHadDrug(d);
      return d.category === catFilter;
    });
  }, [drugs, catFilter]);

  const currentDrug = useMemo(
    () => drugs.find((d) => d.id === selectedDrugId) || filteredDrugs[0],
    [drugs, selectedDrugId, filteredDrugs]
  );

  useEffect(() => {
    if (
      filteredDrugs.length > 0 &&
      !filteredDrugs.some((d) => d.id === selectedDrugId)
    ) {
      setSelectedDrugId(filteredDrugs[0].id);
    }
  }, [filteredDrugs, selectedDrugId]);

  if (!isOpen) return null;

  const isMultiDose =
    Boolean(currentDrug?.isMultiDoseVial) ||
    Boolean(currentDrug?.name.toLowerCase().includes('ketamine'));
  const isVolatile = currentDrug?.category === 'inhalation';
  const totalOpenedDose = currentDrug
    ? isMultiDose
      ? currentDrug.vialCapacity || 10
      : (currentDrug.standardVialDose || 0) * vialsOpened
    : 0;

  const usedNum = parseFloat(usedDose) || 0;
  const wastedNum = parseFloat(wastedDose) || 0;
  const sumDose = parseFloat((usedNum + wastedNum).toFixed(3));
  const weightNum = parseFloat(patientWeightKg) || 0;

  const doseMismatch =
    !isMultiDose &&
    !isVolatile &&
    totalOpenedDose > 0 &&
    Math.abs(sumDose - totalOpenedDose) > 0.001;

  const requiresWitness =
    currentDrug?.category === 'opioid' || (currentDrug ? isHadDrug(currentDrug) : false);

  const hasDrugAllergyWarning =
    allergy.trim() !== '' &&
    !allergy.toLowerCase().includes('nkda') &&
    !allergy.includes('ปฏิเสธ');

  const sulfaContraindication =
    allergy.toLowerCase().includes('sulfa') &&
    currentDrug?.name.toLowerCase().includes('dynastat');

  const handleAutoCalculateWastage = () => {
    if (!currentDrug || isMultiDose || isVolatile) return;
    const rem = Math.max(0, parseFloat((totalOpenedDose - usedNum).toFixed(3)));
    setWastedDose(String(rem));
  };

  const applyQuickPatient = (pt: AggregatedDailyPatient) => {
    setPatientId(pt.patientRecord?.id);
    setPatientName(pt.patientName);
    setHn(pt.hn);
    setPatientAge(pt.age !== undefined ? String(pt.age) : '');
    setPatientWeightKg(pt.weightKg !== undefined ? String(pt.weightKg) : '');
    setAsaClass(pt.asaClass || 'ASA II');
    setAllergy(pt.allergy || 'ปฏิเสธแพ้ยา (NKDA)');
    setOperatingRoom(pt.operatingRoom);
    setProcedure(pt.procedure || '');
    setAnesthesiaType(pt.anesthesiaType || ANESTHESIA_TYPES[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientName.trim()) {
      setFormError('กรุณาระบุชื่อ-นามสกุลผู้ป่วยที่ใช้ยา');
      return;
    }
    if (!hn.trim()) {
      setFormError('กรุณาระบุเลขประจำตัวผู้ป่วย (HN)');
      return;
    }
    if (!currentDrug) {
      setFormError('กรุณาเลือกรายการยา');
      return;
    }
    if (usedNum <= 0 && wastedNum <= 0) {
      setFormError('กรุณาระบุปริมาณยาที่ใช้จริง (Used) หรือปริมาณยาที่ทิ้ง');
      return;
    }
    if (!isMultiDose && currentDrug.stockCount < vialsOpened) {
      setFormError(
        `สต็อกยา ${currentDrug.name} เหลือเพียง ${currentDrug.stockCount} หลอด ไม่เพียงพอสำหรับการเบิก ${vialsOpened} หลอด`
      );
      return;
    }
    if (!administratorName) {
      setFormError('กรุณาเลือกผู้บริหารยา');
      return;
    }
    if (requiresWitness && !witnessName) {
      setFormError(
        'กลุ่มยา Opioid และยาความเสี่ยงสูง (HAD) จำเป็นต้องระบุพยานตรวจสอบร่วม (Double Check)'
      );
      return;
    }
    if (!Object.values(sixRights).every(Boolean)) {
      setFormError('กรุณายืนยันการตรวจสอบหลักความปลอดภัยทางยา 6 Rights ให้ครบทั้ง 6 ข้อ');
      return;
    }

    const adminStaff = staffList.find((s) => s.name === administratorName);
    const witStaff = staffList.find((s) => s.name === witnessName);

    onSubmitAdministration(
      {
        drugId: currentDrug.id,
        drugName: currentDrug.name,
        category: currentDrug.category,
        unit: currentDrug.unit,
        vialsOpened: isMultiDose ? 0 : vialsOpened,
        totalOpenedDose,
        usedDose: usedNum,
        wastedDose: wastedNum,
        wastageReason:
          wastedNum > 0 ? wastageReason : 'ไม่มีเศษยาเหลือทิ้ง (Used all)',
        disposalMethod: wastedNum > 0 ? disposalMethod : '-',
        operatingRoom,
        caseNumber: hn.trim(),
        patientId,
        patientName: patientName.trim(),
        hn: hn.trim(),
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientWeightKg: patientWeightKg ? parseFloat(patientWeightKg) : undefined,
        asaClass,
        allergy: allergy.trim() || 'ปฏิเสธแพ้ยา (NKDA)',
        procedure: procedure.trim() || 'หัตถการระงับความรู้สึกในห้องผ่าตัด',
        anesthesiaType,
        administratorName,
        administratorRole: adminStaff?.role || 'anesthesiologist',
        witnessName: witnessName || '-',
        witnessRole: witStaff?.role || '-',
        safetyChecked: true,
        isHad: isHadDrug(currentDrug),
        isHighAlert: currentDrug.isHighAlert,
        recordedByEmail: activeOperatorName,
        dateString,
        hasMedicationError: hasMedError,
        errorSeverityLevel: hasMedError ? errorSeverity : undefined,
        errorNote: hasMedError ? errorNote : undefined,
      },
      hasMedError
        ? {
            drugId: currentDrug.id,
            drugName: currentDrug.name,
            category: currentDrug.category,
            severityLevel: errorSeverity,
            errorType,
            description:
              errorNote.trim() ||
              `บันทึกเหตุการณ์ความคลาดเคลื่อนทางยา / Near Miss ในเคส ${patientName.trim()} (${hn.trim()})`,
            operatingRoom,
            caseNumber: hn.trim(),
            patientName: patientName.trim(),
            hn: hn.trim(),
            discoveredBy: witnessName || administratorName,
            reportedBy: administratorName,
            correctiveAction: 'ตรวจสอบซ้ำตามมาตรฐาน Double Check และเฝ้าระวังอาการผู้ป่วยใกล้ชิด',
            preventiveAction: 'ปฏิบัติตามหลัก 6 Rights และตรวจสอบประวัติผู้ป่วยก่อนให้ยาทุกครั้ง',
            status: 'reported',
          }
        : undefined
    );

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <Syringe className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <h2
                id="record-modal-title"
                className="text-base font-bold text-slate-900"
              >
                บันทึกการใช้ยากับผู้ป่วยประจำวัน และทำลายเศษยาเหลือทิ้ง
              </h2>
              <p className="text-xs text-slate-500">
                เชื่อมโยงรายชื่อผู้ป่วยเข้าสมุดทะเบียนประจำวัน พร้อมตัดสต็อกอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-800"
        >
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: ข้อมูลผู้ป่วยที่ใช้ยาประจำวัน */}
          <div className="space-y-3 pb-5 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>1. ข้อมูลผู้ป่วยที่ใช้ยาประจำวัน (Patient Identification)</span>
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="admin-date" className="text-slate-500">
                  วันที่ใช้ยา:
                </label>
                <input
                  id="admin-date"
                  type="date"
                  value={dateString}
                  onChange={(e) => setDateString(e.target.value)}
                  className="py-1 px-2.5 rounded-lg border border-slate-300 font-mono tabular-nums text-xs"
                />
              </div>
            </div>

            {/* Quick-pick from today's patient roster */}
            {patientsOnSelectedDate.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">
                  คลิกเลือกผู้ป่วยที่มีรายชื่อในวันที่ {dateString} เพื่อดึงข้อมูลอัตโนมัติ:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {patientsOnSelectedDate.map((pt) => {
                    const active =
                      hn.trim().toLowerCase() === pt.hn.trim().toLowerCase() &&
                      hn.trim() !== '';
                    return (
                      <button
                        key={pt.key}
                        type="button"
                        onClick={() => applyQuickPatient(pt)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-teal-700 border-teal-700 text-white font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pt.patientName} ({pt.hn})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุลผู้ป่วย *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="เช่น นายสมศักดิ์ เจริญสุข"
                  required
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขประจำตัวผู้ป่วย (HN) *
                </label>
                <input
                  type="text"
                  value={hn}
                  onChange={(e) => setHn(e.target.value)}
                  placeholder="เช่น HN 69-01045"
                  required
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  อายุ (ปี)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="54"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  น้ำหนัก (กก.)
                </label>
                <input
                  type="number"
                  min="1"
                  max="250"
                  step="0.1"
                  value={patientWeightKg}
                  onChange={(e) => setPatientWeightKg(e.target.value)}
                  placeholder="68"
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ห้องผ่าตัด (Operating Room) *
                </label>
                <select
                  value={operatingRoom}
                  onChange={(e) => setOperatingRoom(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium"
                >
                  {OPERATING_ROOMS.map((rm) => (
                    <option key={rm} value={rm}>
                      {rm}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  หัตถการผ่าตัด (Procedure)
                </label>
                <input
                  type="text"
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  placeholder="เช่น Laparoscopic Cholecystectomy"
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ASA Status
                </label>
                <select
                  value={asaClass}
                  onChange={(e) => setAsaClass(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs sm:text-sm"
                >
                  {ASA_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชนิดการระงับความรู้สึก
                </label>
                <select
                  value={anesthesiaType}
                  onChange={(e) => setAnesthesiaType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  {ANESTHESIA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ประวัติแพ้ยา (Drug Allergy)
                </label>
                <input
                  type="text"
                  value={allergy}
                  onChange={(e) => setAllergy(e.target.value)}
                  placeholder="ปฏิเสธแพ้ยา (NKDA) หรือระบุยาที่แพ้"
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            {hasDrugAllergyWarning && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  sulfaContraindication
                    ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                    : 'bg-amber-50 border-amber-200 text-amber-900 font-medium'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>
                  {sulfaContraindication
                    ? `คำเตือนห้ามใช้ยาเด็ดขาด: ผู้ป่วยมีประวัติ "${allergy}" ห้ามบริหารยา Dynastat (Parecoxib)!`
                    : `ระวังประวัติแพ้ยาผู้ป่วย: ${allergy} — กรุณาตรวจสอบกลุ่มยาก่อนบริหาร`}
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: เลือกรายการยาและปริมาณใช้/ทิ้ง */}
          <div className="space-y-3 pb-5 border-b border-slate-200">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              2. เลือกรายการยาและบันทึกปริมาณที่ใช้จริง / เศษยาทิ้ง
            </h3>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'opioid', label: 'Opioid' },
                  { id: 'muscle_relaxant', label: 'Muscle Relaxant' },
                  { id: 'local_anesthetic', label: 'Local Anesthetic' },
                  { id: 'had', label: 'กลุ่มยา HAD' },
                  { id: 'inhalation', label: 'Inhalation' },
                  { id: 'general', label: 'ยาทั่วไป' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatFilter(c.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    catFilter === c.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <select
              value={currentDrug?.id || ''}
              onChange={(e) => setSelectedDrugId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold text-xs sm:text-sm"
            >
              {filteredDrugs.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.category.toUpperCase()}]{isHadDrug(d) ? ' [HAD]' : ''} {d.name} — คงเหลือ{' '}
                  {d.stockCount} ({d.concentration})
                </option>
              ))}
            </select>

            {currentDrug && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">
                      {currentDrug.genericName}
                    </span>
                    <span className="text-slate-500 font-mono ml-2">
                      ({currentDrug.concentration})
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-600">
                    บรรจุ {currentDrug.standardVialDose} {currentDrug.unit} · สต็อกคงเหลือ{' '}
                    <strong className="text-slate-900">{currentDrug.stockCount}</strong>
                  </div>
                </div>

                {isMultiDose && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-700">
                      ขวดเปิดใช้สะสมปัจจุบัน:{' '}
                      <strong className="font-mono tabular-nums">
                        {currentDrug.activeVialUsed ?? 0} / {currentDrug.vialCapacity ?? 10} ml
                      </strong>{' '}
                      (คงเหลือในขวด {currentDrug.activeVialRemaining ?? 10} ml)
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.5, 1, 1.5, 2].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setUsedDose(String(val))}
                          className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-mono text-[11px] cursor-pointer"
                        >
                          {val} ml
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {isMultiDose ? 'โหมดตัดขวด' : 'จำนวนหลอด/ขวดที่เปิด *'}
                    </label>
                    {isMultiDose ? (
                      <div className="p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-500 font-medium">
                        สะสมจากขวด 10 ml เดิม
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={vialsOpened}
                        onChange={(e) =>
                          setVialsOpened(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono tabular-nums font-bold text-sm"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-800 mb-1">
                      ปริมาณที่ใช้กับผู้ป่วยจริง ({currentDrug.unit}) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={usedDose}
                      onChange={(e) => setUsedDose(e.target.value)}
                      placeholder={`เช่น ${currentDrug.standardVialDose}`}
                      required
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono tabular-nums font-bold text-sm text-emerald-800"
                    />
                    {weightNum > 0 &&
                      usedNum > 0 &&
                      (currentDrug.unit === 'mg' || currentDrug.unit === 'mcg') && (
                        <div className="text-[11px] text-teal-800 font-mono tabular-nums mt-1">
                          = {(usedNum / weightNum).toFixed(2)} {currentDrug.unit}/kg (นน.{' '}
                          {weightNum} กก.)
                        </div>
                      )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-rose-800">
                        เศษยาที่ทิ้ง ({currentDrug.unit})
                      </label>
                      {!isMultiDose && !isVolatile && (
                        <button
                          type="button"
                          onClick={handleAutoCalculateWastage}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                        >
                          คำนวณอัตโนมัติ
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={wastedDose}
                      onChange={(e) => setWastedDose(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono tabular-nums font-bold text-sm text-rose-800"
                    />
                  </div>
                </div>

                {/* Balance check bar */}
                {!isMultiDose && !isVolatile && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      doseMismatch
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <span className="font-mono tabular-nums">
                      สมดุลปริมาณยา: ใช้ ({usedNum}) + ทิ้ง ({wastedNum}) ={' '}
                      <strong>
                        {sumDose} {currentDrug.unit}
                      </strong>{' '}
                      / ขนาดที่เปิด {totalOpenedDose} {currentDrug.unit}
                    </span>
                    {doseMismatch && (
                      <button
                        type="button"
                        onClick={handleAutoCalculateWastage}
                        className="px-2.5 py-1 rounded bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-medium cursor-pointer"
                      >
                        ปรับยอดทิ้งให้ตรงขนาดหลอด
                      </button>
                    )}
                  </div>
                )}

                {wastedNum > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        สาเหตุการมีเศษยาเหลือทิ้ง *
                      </label>
                      <select
                        value={wastageReason}
                        onChange={(e) => setWastageReason(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      >
                        {WASTAGE_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        วิธีการทำลายเศษยาเหลือทิ้ง *
                      </label>
                      <select
                        value={disposalMethod}
                        onChange={(e) => setDisposalMethod(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                      >
                        {DISPOSAL_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: ผู้บริหารยา พยาน และ 6 Rights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                3. ผู้บริหารยา พยานตรวจสอบ (Double Check) และ 6 Rights
              </h3>
              <button
                type="button"
                onClick={onOpenStaffModal}
                className="text-xs font-medium text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                จัดการรายชื่อบุคลากร
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้บริหารยา (Primary Administrator) *
                </label>
                <select
                  value={administratorName}
                  onChange={(e) => setAdministratorName(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                >
                  <option value="">-- เลือกผู้บริหารยา --</option>
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  พยานตรวจสอบร่วม / ทำลายเศษยา{' '}
                  {requiresWitness && (
                    <span className="text-rose-700 font-semibold">* บังคับสำหรับ Opioid/HAD</span>
                  )}
                </label>
                <select
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  required={requiresWitness}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                >
                  <option value="">-- เลือกพยานตรวจสอบร่วม --</option>
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6 Rights Checklist */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>ยืนยันหลักความปลอดภัยทางยา 6 Rights</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                {(
                  [
                    { key: 'patient', label: '1. ถูกผู้ป่วย (Right Patient)' },
                    { key: 'drug', label: '2. ถูกยา (Right Drug)' },
                    { key: 'dose', label: '3. ถูกขนาด (Right Dose)' },
                    { key: 'route', label: '4. ถูกวิถีทาง (Right Route)' },
                    { key: 'time', label: '5. ถูกเวลา (Right Time)' },
                    { key: 'witness', label: '6. บันทึกและพยานครบถ้วน' },
                  ] as const
                ).map((item) => (
                  <label key={item.key} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sixRights[item.key]}
                      onChange={(e) =>
                        setSixRights((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="rounded text-teal-700 focus:ring-teal-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Medication Error / Near Miss Inline Toggle */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMedError}
                  onChange={(e) => setHasMedError(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>
                  พบความคลาดเคลื่อนทางยา หรือ Near Miss ในเคสนี้ (บันทึกเชื่อมรายงาน NCC MERP)
                </span>
              </label>

              {hasMedError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ระดับความรุนแรง (NCC MERP)
                    </label>
                    <select
                      value={errorSeverity}
                      onChange={(e) =>
                        setErrorSeverity(e.target.value as NccMerpSeverity)
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as NccMerpSeverity[]).map(
                        (lvl) => (
                          <option key={lvl} value={lvl}>
                            {NCC_MERP_LEVELS[lvl].titleTh}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      ประเภทความคลาดเคลื่อน
                    </label>
                    <select
                      value={errorType}
                      onChange={(e) => setErrorType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {ERROR_TYPES.map((et) => (
                        <option key={et.value} value={et.value}>
                          {et.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">
                      รายละเอียดเหตุการณ์และการแก้ไข
                    </label>
                    <input
                      type="text"
                      value={errorNote}
                      onChange={(e) => setErrorNote(e.target.value)}
                      placeholder="เช่น พยานตรวจพบความเข้มข้นคลาดเคลื่อนก่อนบริหารยา จึงแก้ไขทันที..."
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={sulfaContraindication}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกการใช้ยาและอัปเดตรายชื่อผู้ป่วย</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
