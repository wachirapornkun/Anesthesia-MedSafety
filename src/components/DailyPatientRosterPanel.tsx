import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Plus,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  DailyPatientRecord,
  DrugAdministration,
  PatientCaseStatus,
} from '../types';
import {
  CATEGORY_META,
  getLocalDateString,
  getShiftedDateString,
  isHadDrug,
  OPERATING_ROOMS,
  PATIENT_STATUS_LABELS,
} from '../data/catalog';

export interface AggregatedDailyPatient {
  key: string;
  patientRecord?: DailyPatientRecord;
  patientName: string;
  hn: string;
  age?: number;
  weightKg?: number;
  asaClass: string;
  allergy: string;
  operatingRoom: string;
  procedure: string;
  anesthesiaType: string;
  primaryStaffName: string;
  status: PatientCaseStatus;
  firstTime?: string;
  lastTime?: string;
  administrations: DrugAdministration[];
  drugSummaries: {
    drugName: string;
    shortName: string;
    unit: string;
    category: DrugAdministration['category'];
    isHad: boolean;
    usedTotal: number;
    wastedTotal: number;
    vialsTotal: number;
  }[];
  hasOpioid: boolean;
  hasHad: boolean;
  hasWastage: boolean;
}

interface DailyPatientRosterPanelProps {
  selectedDate: string;
  onChangeDate: (date: string) => void;
  dailyPatients: DailyPatientRecord[];
  administrations: DrugAdministration[];
  selectedPatientHnFilter?: string | null;
  onSelectPatientHnFilter?: (hn: string | null) => void;
  onAddDrugForPatient: (patient: AggregatedDailyPatient) => void;
  onOpenNewPatientModal: (dateString: string) => void;
  onEditPatientModal: (patient: AggregatedDailyPatient) => void;
  onUpdatePatientStatus?: (patientId: string, status: PatientCaseStatus) => void;
  compact?: boolean;
  onNavigateFullDailyView?: () => void;
}

export function buildAggregatedDailyPatients(
  dateString: string,
  dailyPatients: DailyPatientRecord[],
  administrations: DrugAdministration[]
): AggregatedDailyPatient[] {
  const map = new Map<string, AggregatedDailyPatient>();

  const patientsForDate = dailyPatients.filter((p) => p.dateString === dateString);
  const adminsForDate = administrations
    .filter((a) => a.dateString === dateString)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const pt of patientsForDate) {
    const normHn = pt.hn.trim().toLowerCase();
    map.set(normHn, {
      key: pt.id,
      patientRecord: pt,
      patientName: pt.patientName,
      hn: pt.hn,
      age: pt.age,
      weightKg: pt.weightKg,
      asaClass: pt.asaClass || 'ASA II',
      allergy: pt.allergy || 'ปฏิเสธแพ้ยา (NKDA)',
      operatingRoom: pt.operatingRoom,
      procedure: pt.procedure,
      anesthesiaType: pt.anesthesiaType,
      primaryStaffName: pt.primaryStaffName,
      status: pt.status,
      firstTime: pt.scheduledTime,
      administrations: [],
      drugSummaries: [],
      hasOpioid: false,
      hasHad: false,
      hasWastage: false,
    });
  }

  for (const adm of adminsForDate) {
    const normHn = (adm.hn || adm.caseNumber || adm.patientName).trim().toLowerCase();
    const admTime = new Date(adm.timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let entry = map.get(normHn);
    if (!entry) {
      entry = {
        key: `derived-${normHn}`,
        patientName: adm.patientName || 'ผู้ป่วยห้องผ่าตัด',
        hn: adm.hn || adm.caseNumber || '-',
        age: adm.patientAge,
        weightKg: adm.patientWeightKg,
        asaClass: adm.asaClass || 'ASA II',
        allergy: adm.allergy || 'ปฏิเสธแพ้ยา (NKDA)',
        operatingRoom: adm.operatingRoom,
        procedure: adm.procedure || 'หัตถการระงับความรู้สึกในห้องผ่าตัด',
        anesthesiaType: adm.anesthesiaType || 'General Anesthesia (GA)',
        primaryStaffName: adm.administratorName,
        status: 'in_or',
        firstTime: admTime,
        lastTime: admTime,
        administrations: [],
        drugSummaries: [],
        hasOpioid: false,
        hasHad: false,
        hasWastage: false,
      };
      map.set(normHn, entry);
    }

    if (!entry.firstTime || entry.administrations.length === 0) {
      entry.firstTime = admTime;
    }
    entry.lastTime = admTime;
    entry.administrations.push(adm);

    if (adm.category === 'opioid') entry.hasOpioid = true;
    if (isHadDrug(adm)) entry.hasHad = true;
    if (adm.wastedDose > 0) entry.hasWastage = true;
  }

  const list = Array.from(map.values()).map((entry) => {
    const drugMap = new Map<
      string,
      AggregatedDailyPatient['drugSummaries'][number]
    >();

    for (const adm of entry.administrations) {
      const existing = drugMap.get(adm.drugName) || {
        drugName: adm.drugName,
        shortName: adm.drugName.split('(')[0].trim(),
        unit: adm.unit,
        category: adm.category,
        isHad: isHadDrug(adm),
        usedTotal: 0,
        wastedTotal: 0,
        vialsTotal: 0,
      };
      existing.usedTotal = parseFloat((existing.usedTotal + adm.usedDose).toFixed(2));
      existing.wastedTotal = parseFloat((existing.wastedTotal + adm.wastedDose).toFixed(2));
      existing.vialsTotal += adm.vialsOpened || 0;
      drugMap.set(adm.drugName, existing);
    }

    return {
      ...entry,
      drugSummaries: Array.from(drugMap.values()),
    };
  });

  return list.sort((a, b) => (a.firstTime || '99:99').localeCompare(b.firstTime || '99:99'));
}

export const DailyPatientRosterPanel: React.FC<DailyPatientRosterPanelProps> = ({
  selectedDate,
  onChangeDate,
  dailyPatients,
  administrations,
  selectedPatientHnFilter,
  onSelectPatientHnFilter,
  onAddDrugForPatient,
  onOpenNewPatientModal,
  onEditPatientModal,
  onUpdatePatientStatus,
  compact = false,
  onNavigateFullDailyView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'used_drugs' | 'opioid' | 'had' | 'scheduled'>(
    compact ? 'used_drugs' : 'all'
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const todayStr = getLocalDateString();
  const yesterdayStr = getShiftedDateString(-1);

  const allDailyPatients = useMemo(
    () => buildAggregatedDailyPatients(selectedDate, dailyPatients, administrations),
    [selectedDate, dailyPatients, administrations]
  );

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allDailyPatients.filter((pt) => {
      if (roomFilter !== 'all' && pt.operatingRoom !== roomFilter) return false;
      if (riskFilter === 'used_drugs' && pt.administrations.length === 0) return false;
      if (riskFilter === 'opioid' && !pt.hasOpioid) return false;
      if (riskFilter === 'had' && !pt.hasHad) return false;
      if (riskFilter === 'scheduled' && pt.administrations.length > 0) return false;

      if (!q) return true;
      const inPatient =
        pt.patientName.toLowerCase().includes(q) ||
        pt.hn.toLowerCase().includes(q) ||
        pt.procedure.toLowerCase().includes(q) ||
        pt.operatingRoom.toLowerCase().includes(q) ||
        pt.primaryStaffName.toLowerCase().includes(q);
      const inDrugs = pt.drugSummaries.some((d) =>
        d.drugName.toLowerCase().includes(q)
      );
      return inPatient || inDrugs;
    });
  }, [allDailyPatients, roomFilter, riskFilter, searchQuery]);

  const activeDrugPatientCount = allDailyPatients.filter(
    (p) => p.administrations.length > 0
  ).length;
  const scheduledWaitingCount = allDailyPatients.filter(
    (p) => p.administrations.length === 0
  ).length;

  const handleExportCsv = () => {
    const headers = [
      'วันที่',
      'เวลาเริ่ม',
      'ชื่อ-นามสกุลผู้ป่วย',
      'HN',
      'อายุ (ปี)',
      'น้ำหนัก (กก.)',
      'ASA',
      'ประวัติแพ้ยา',
      'ห้องผ่าตัด',
      'หัตถการ',
      'ชนิดระงับความรู้สึก',
      'สถานะเคส',
      'จำนวนรายการยา',
      'รายการยาและขนาดที่ใช้จริง',
      'เศษยาที่ทำลาย',
      'ผู้รับผิดชอบหลัก',
    ];

    const rows = filteredPatients.map((pt) => {
      const usedSummary = pt.drugSummaries
        .map((d) => `${d.shortName}: ${d.usedTotal} ${d.unit}`)
        .join(' | ');
      const wastedSummary = pt.drugSummaries
        .filter((d) => d.wastedTotal > 0)
        .map((d) => `${d.shortName}: ${d.wastedTotal} ${d.unit}`)
        .join(' | ');

      return [
        selectedDate,
        pt.firstTime || '-',
        pt.patientName,
        pt.hn,
        pt.age ?? '-',
        pt.weightKg ?? '-',
        pt.asaClass,
        pt.allergy,
        pt.operatingRoom,
        pt.procedure,
        pt.anesthesiaType,
        PATIENT_STATUS_LABELS[pt.status].th,
        pt.drugSummaries.length,
        usedSummary || 'ยังไม่มีการใช้ยา',
        wastedSummary || 'ไม่มีเศษยาทิ้ง',
        pt.primaryStaffName,
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายชื่อผู้ป่วยใช้ยาประจำวัน_${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasDrugAllergy = (allergyText: string) => {
    const lower = allergyText.toLowerCase();
    return (
      allergyText.trim() !== '' &&
      !lower.includes('nkda') &&
      !lower.includes('ปฏิเสธ') &&
      !lower.includes('ไม่มี')
    );
  };

  return (
    <section
      aria-label="ช่องแสดงรายชื่อผู้ป่วยที่ใช้ยาประจำวัน"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-800">
                <Users className="w-4 h-4 text-teal-700" />
                <span>ทะเบียนรายชื่อผู้ป่วยที่ใช้ยาประจำวัน</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">วันที่ {selectedDate}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-700 font-medium">
                ใช้ยาแล้ว {activeDrugPatientCount} ราย
              </span>
              {scheduledWaitingCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    รอรับยา {scheduledWaitingCount} ราย
                  </span>
                </>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              รายชื่อผู้ป่วยที่ใช้ยาวิสัญญีประจำวัน
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date quick switch + picker */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => onChangeDate(yesterdayStr)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDate === yesterdayStr
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เมื่อวาน
              </button>
              <button
                type="button"
                onClick={() => onChangeDate(todayStr)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                วันนี้
              </button>
            </div>

            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeDate(e.target.value)}
                aria-label="เลือกวันที่แสดงรายชื่อผู้ป่วย"
                className="pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
            </div>

            <button
              type="button"
              onClick={() => onOpenNewPatientModal(selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-700 text-teal-800 bg-teal-50/60 hover:bg-teal-100/70 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มชื่อผู้ป่วยวันนี้</span>
            </button>

            {!compact ? (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>ส่งออก CSV</span>
              </button>
            ) : (
              onNavigateFullDailyView && (
                <button
                  type="button"
                  onClick={onNavigateFullDailyView}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>เปิดทะเบียนผู้ป่วยแบบเต็ม</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Search & Segmented Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[230px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ-นามสกุลผู้ป่วย, HN, หัตถการ หรือชื่อยาที่ใช้..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
            </div>

            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              aria-label="กรองตามห้องผ่าตัด"
              className="py-2 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            >
              <option value="all">ทุกห้องผ่าตัด</option>
              {OPERATING_ROOMS.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive segmented filter buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all' as const, label: `ทั้งหมด (${allDailyPatients.length})` },
                { id: 'used_drugs' as const, label: `ใช้ยาแล้ว (${activeDrugPatientCount})` },
                {
                  id: 'opioid' as const,
                  label: `ได้รับ Opioid (${allDailyPatients.filter((p) => p.hasOpioid).length})`,
                },
                {
                  id: 'had' as const,
                  label: `ได้รับ HAD (${allDailyPatients.filter((p) => p.hasHad).length})`,
                },
                ...(scheduledWaitingCount > 0
                  ? [
                      {
                        id: 'scheduled' as const,
                        label: `รอให้ยา (${scheduledWaitingCount})`,
                      },
                    ]
                  : []),
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRiskFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  riskFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
            <tr>
              <th className="py-3 px-4 whitespace-nowrap">ลำดับ / เวลา</th>
              <th className="py-3 px-4 whitespace-nowrap">ชื่อ-นามสกุลผู้ป่วย / HN</th>
              <th className="py-3 px-4 whitespace-nowrap">ห้องผ่าตัด / หัตถการ</th>
              <th className="py-3 px-4">รายการยาและปริมาณที่ใช้จริงวันนี้</th>
              {!compact && (
                <th className="py-3 px-3 whitespace-nowrap">สถานะเคส / ผู้ดูแล</th>
              )}
              <th className="py-3 px-4 text-right whitespace-nowrap">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={compact ? 5 : 6} className="py-12 px-4 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    ไม่พบรายชื่อผู้ป่วยที่ใช้ยาในวันที่ {selectedDate} ตามเงื่อนไขที่เลือก
                  </p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    คุณสามารถเพิ่มรายชื่อผู้ป่วยประจำวันล่วงหน้า หรือบันทึกการบริหารยาเพื่อสร้างรายชื่อผู้ป่วยอัตโนมัติ
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenNewPatientModal(selectedDate)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>เพิ่มรายชื่อผู้ป่วยประจำวัน</span>
                  </button>
                </td>
              </tr>
            ) : (
              filteredPatients.map((pt, index) => {
                const isExpanded = expandedKey === pt.key;
                const isSelectedForLog =
                  selectedPatientHnFilter &&
                  selectedPatientHnFilter.toLowerCase() === pt.hn.toLowerCase();
                const allergyAlert = hasDrugAllergy(pt.allergy);
                const statusInfo = PATIENT_STATUS_LABELS[pt.status];

                return (
                  <React.Fragment key={pt.key}>
                    <tr
                      className={`transition-colors ${
                        isSelectedForLog
                          ? 'bg-teal-50/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Index & Time */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="font-mono tabular-nums font-semibold text-slate-800 text-xs">
                          #{index + 1} · {pt.firstTime || '--:--'} น.
                        </div>
                        {pt.lastTime && pt.lastTime !== pt.firstTime && (
                          <div className="font-mono tabular-nums text-[11px] text-slate-400 mt-0.5">
                            ล่าสุด {pt.lastTime} น.
                          </div>
                        )}
                      </td>

                      {/* 2. Patient Full Name, HN, Demographics & Allergy */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900 text-sm">
                          {pt.patientName}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                          <span className="text-slate-700 font-medium">{pt.hn}</span>
                          {pt.age !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans">{pt.age} ปี</span>
                            </>
                          )}
                          {pt.weightKg !== undefined && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{pt.weightKg} กก.</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{pt.asaClass}</span>
                        </div>
                        {allergyAlert ? (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{pt.allergy}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {pt.allergy}
                          </div>
                        )}
                      </td>

                      {/* 3. OR & Procedure */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {pt.operatingRoom}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 max-w-[230px]">
                          {pt.procedure}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {pt.anesthesiaType}
                        </div>
                      </td>

                      {/* 4. Medications Used Today */}
                      <td className="py-3.5 px-4 align-top">
                        {pt.drugSummaries.length === 0 ? (
                          <div className="text-xs text-slate-400">
                            ยังไม่มีบันทึกการใช้ยาในวันนี้
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {pt.drugSummaries.map((drug) => {
                              const catMeta = CATEGORY_META[drug.category];
                              return (
                                <div
                                  key={drug.drugName}
                                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs border-b border-slate-100 last:border-b-0 pb-1 last:pb-0"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-medium text-slate-900">
                                      {drug.shortName}
                                    </span>
                                    <span aria-hidden="true" className="text-slate-300">
                                      ·
                                    </span>
                                    <span className={`text-[11px] ${catMeta.textClass}`}>
                                      {drug.isHad ? 'HAD' : catMeta.shortTh}
                                    </span>
                                  </div>
                                  <div className="font-mono tabular-nums text-xs shrink-0">
                                    <span className="text-emerald-700 font-semibold">
                                      ใช้ {drug.usedTotal} {drug.unit}
                                    </span>
                                    {drug.wastedTotal > 0 && (
                                      <span className="text-rose-700 ml-2">
                                        · ทิ้ง {drug.wastedTotal} {drug.unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* 5. Case Status & Responsible Staff */}
                      {!compact && (
                        <td className="py-3.5 px-3 align-top whitespace-nowrap">
                          {pt.patientRecord && onUpdatePatientStatus ? (
                            <select
                              value={pt.status}
                              onChange={(e) =>
                                onUpdatePatientStatus(
                                  pt.patientRecord!.id,
                                  e.target.value as PatientCaseStatus
                                )
                              }
                              aria-label={`สถานะเคสของ ${pt.patientName}`}
                              className={`text-xs font-semibold rounded-lg border border-slate-200 bg-white py-1 px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-600/20 ${statusInfo.textClass}`}
                            >
                              <option value="scheduled">รอเริ่มระงับความรู้สึก</option>
                              <option value="in_or">กำลังผ่าตัดใน OR</option>
                              <option value="pacu">สังเกตอาการ PACU</option>
                              <option value="completed">เสร็จสิ้นเคส</option>
                            </select>
                          ) : (
                            <div className={`text-xs font-semibold ${statusInfo.textClass}`}>
                              {statusInfo.th}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 mt-1 max-w-[170px] truncate">
                            {pt.primaryStaffName}
                          </div>
                        </td>
                      )}

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAddDrugForPatient(pt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่มยาเคสนี้</span>
                          </button>

                          {pt.administrations.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedKey((prev) => (prev === pt.key ? null : pt.key))
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span>ไทม์ไลน์ ({pt.administrations.length})</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditPatientModal(pt)}
                            title="แก้ไขข้อมูลผู้ป่วย"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {onSelectPatientHnFilter && pt.administrations.length > 0 && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectPatientHnFilter(isSelectedForLog ? null : pt.hn)
                              }
                              className="text-[11px] font-medium text-teal-700 hover:text-teal-900 underline underline-offset-2 cursor-pointer"
                            >
                              {isSelectedForLog
                                ? 'ยกเลิกกรองตารางด้านล่าง'
                                : 'กรองเฉพาะผู้ป่วยรายนี้ในตารางเวลา'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Per-Patient Drug Administration Timeline */}
                    {isExpanded && pt.administrations.length > 0 && (
                      <tr className="bg-slate-50/90">
                        <td colSpan={compact ? 5 : 6} className="px-4 sm:px-6 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
                            <div className="font-semibold text-slate-800">
                              รายละเอียดลำดับเวลาการให้ยาของ {pt.patientName} ({pt.hn})
                            </div>
                            <div className="text-slate-500 font-mono tabular-nums">
                              รวมบันทึก {pt.administrations.length} ครั้ง · เปิดยารวม{' '}
                              {pt.administrations.reduce(
                                (sum, a) => sum + (a.vialsOpened || 0),
                                0
                              )}{' '}
                              หลอด/ขวด
                            </div>
                          </div>

                          <div className="border border-slate-200 rounded-lg bg-white overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                  <th className="py-2 px-3">เวลา</th>
                                  <th className="py-2 px-3">รายการยา</th>
                                  <th className="py-2 px-3 text-right">ขนาดที่ใช้จริง</th>
                                  {pt.weightKg && pt.weightKg > 0 ? (
                                    <th className="py-2 px-3 text-right">ขนาดต่อน้ำหนัก</th>
                                  ) : null}
                                  <th className="py-2 px-3 text-right">เศษยาที่ทิ้ง</th>
                                  <th className="py-2 px-3">ผู้บริหารยา / พยานตรวจสอบ</th>
                                  <th className="py-2 px-3">การทำลายเศษยา</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {pt.administrations.map((adm) => {
                                  const tStr = new Date(adm.timestamp).toLocaleTimeString(
                                    'th-TH',
                                    { hour: '2-digit', minute: '2-digit' }
                                  );
                                  const dosePerKg =
                                    pt.weightKg &&
                                    pt.weightKg > 0 &&
                                    (adm.unit === 'mg' || adm.unit === 'mcg')
                                      ? `${(adm.usedDose / pt.weightKg).toFixed(2)} ${adm.unit}/kg`
                                      : '-';

                                  return (
                                    <tr key={adm.id}>
                                      <td className="py-2 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                                        {tStr} น.
                                      </td>
                                      <td className="py-2 px-3 font-medium text-slate-900">
                                        {adm.drugName}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                                        {adm.usedDose} {adm.unit}
                                      </td>
                                      {pt.weightKg && pt.weightKg > 0 ? (
                                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                                          {dosePerKg}
                                        </td>
                                      ) : null}
                                      <td className="py-2 px-3 text-right font-mono tabular-nums text-rose-700 whitespace-nowrap">
                                        {adm.wastedDose > 0
                                          ? `${adm.wastedDose} ${adm.unit}`
                                          : '0'}
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        <span>{adm.administratorName}</span>
                                        {adm.witnessName && adm.witnessName !== '-' && (
                                          <span className="text-slate-400">
                                            {' '}
                                            · พยาน: {adm.witnessName}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500 max-w-[220px] truncate">
                                        {adm.wastedDose > 0
                                          ? adm.disposalMethod
                                          : 'ใช้หมดหลอด'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
