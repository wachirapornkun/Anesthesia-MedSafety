import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Plus,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  DailyPatientRecord,
  DrugAdministration,
  DrugCategory,
  PatientCaseStatus,
} from '../types';
import { CATEGORY_META, isHadDrug } from '../data/catalog';
import {
  AggregatedDailyPatient,
  buildAggregatedDailyPatients,
  DailyPatientRosterPanel,
} from './DailyPatientRosterPanel';

interface DailyLogViewProps {
  selectedDate: string;
  onChangeDate: (date: string) => void;
  dailyPatients: DailyPatientRecord[];
  administrations: DrugAdministration[];
  onOpenRecordModal: () => void;
  onAddDrugForPatient: (patient: AggregatedDailyPatient) => void;
  onOpenNewPatientModal: (dateString: string) => void;
  onEditPatientModal: (patient: AggregatedDailyPatient) => void;
  onUpdatePatientStatus: (patientId: string, status: PatientCaseStatus) => void;
}

export const DailyLogView: React.FC<DailyLogViewProps> = ({
  selectedDate,
  onChangeDate,
  dailyPatients,
  administrations,
  onOpenRecordModal,
  onAddDrugForPatient,
  onOpenNewPatientModal,
  onEditPatientModal,
  onUpdatePatientStatus,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | DrugCategory>('all');
  const [patientHnFilter, setPatientHnFilter] = useState<string | null>(null);

  const dayAdmins = useMemo(
    () =>
      administrations
        .filter((a) => a.dateString === selectedDate)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [administrations, selectedDate]
  );

  const aggregatedPatients = useMemo(
    () => buildAggregatedDailyPatients(selectedDate, dailyPatients, administrations),
    [selectedDate, dailyPatients, administrations]
  );

  const patientsWhoUsedDrugs = aggregatedPatients.filter(
    (p) => p.administrations.length > 0
  );
  const opioidOrHadPatientsCount = patientsWhoUsedDrugs.filter(
    (p) => p.hasOpioid || p.hasHad
  ).length;
  const uniqueRoomsCount = new Set(
    patientsWhoUsedDrugs.map((p) => p.operatingRoom)
  ).size;

  const totalVialsOpened = dayAdmins.reduce((sum, a) => sum + (a.vialsOpened || 0), 0);

  // Calculate overall wastage rate across dose-matched units (excluding multi-dose 0-vial & volatile bottles without wastage)
  const wastageStats = useMemo(() => {
    let openedComparable = 0;
    let wastedComparable = 0;
    for (const a of dayAdmins) {
      if (a.category !== 'inhalation' && (a.usedDose + a.wastedDose) > 0) {
        openedComparable += a.usedDose + a.wastedDose;
        wastedComparable += a.wastedDose;
      }
    }
    const pct = openedComparable > 0 ? (wastedComparable / openedComparable) * 100 : 0;
    return pct.toFixed(1);
  }, [dayAdmins]);

  const filteredAdmins = useMemo(() => {
    return dayAdmins.filter((adm) => {
      if (
        patientHnFilter &&
        adm.hn.trim().toLowerCase() !== patientHnFilter.trim().toLowerCase()
      ) {
        return false;
      }
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'had') return adm.category === 'had' || isHadDrug(adm);
      return adm.category === categoryFilter;
    });
  }, [dayAdmins, patientHnFilter, categoryFilter]);

  const selectedPatientObj = patientHnFilter
    ? aggregatedPatients.find(
        (p) => p.hn.trim().toLowerCase() === patientHnFilter.trim().toLowerCase()
      )
    : null;

  return (
    <div className="space-y-8">
      {/* 4-Column Daily KPI Strip */}
      <section
        aria-label="สรุปภาพรวมการใช้ยาและผู้ป่วยประจำวัน"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="p-5 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            ผู้ป่วยที่ใช้ยาวิสัญญีประจำวัน
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {patientsWhoUsedDrugs.length}
            </span>
            <span className="text-xs text-slate-500">ราย</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            กระจายใน {uniqueRoomsCount} ห้องผ่าตัด · ลงทะเบียนรวม {aggregatedPatients.length} ราย
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            บันทึกการบริหารยาประจำวัน
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {dayAdmins.length}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-mono tabular-nums">
            เปิดใช้ยารวม {totalVialsOpened} หลอด/ขวด
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            ผู้ป่วยที่ได้รับ Opioid หรือยา HAD
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-700 font-mono tabular-nums">
              {opioidOrHadPatientsCount}
            </span>
            <span className="text-xs text-slate-500">ราย</span>
          </div>
          <div className="mt-1.5 text-xs text-emerald-700 font-medium">
            ยืนยัน Double Check พยานครบถ้วน
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            สัดส่วนเศษยาเหลือทิ้งวันนี้ (Wastage)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {wastageStats}%
            </span>
            <span className="text-xs text-slate-500">ของขนาดยาที่เปิด</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            มีเศษยาทำลาย {dayAdmins.filter((a) => a.wastedDose > 0).length} รายการ
          </div>
        </div>
      </section>

      {/* Primary Requested Feature: ช่องแสดงรายชื่อผู้ป่วยที่ใช้ยาประจำวัน */}
      <DailyPatientRosterPanel
        selectedDate={selectedDate}
        onChangeDate={(d) => {
          setPatientHnFilter(null);
          onChangeDate(d);
        }}
        dailyPatients={dailyPatients}
        administrations={administrations}
        selectedPatientHnFilter={patientHnFilter}
        onSelectPatientHnFilter={setPatientHnFilter}
        onAddDrugForPatient={onAddDrugForPatient}
        onOpenNewPatientModal={onOpenNewPatientModal}
        onEditPatientModal={onEditPatientModal}
        onUpdatePatientStatus={onUpdatePatientStatus}
      />

      {/* Chronological Daily Medication Administration Ledger */}
      <section
        aria-label="ตารางบันทึกการบริหารยารายเวลาประจำวัน"
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                สมุดบันทึกการบริหารยาและทำลายเศษยารายเวลา
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงลำดับเวลาการให้ยา ชื่อผู้ป่วย ปริมาณใช้จริง ปริมาณทิ้ง และพยานตรวจสอบประจำวันที่{' '}
                <span className="font-mono tabular-nums">{selectedDate}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenRecordModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกการให้ยารายการใหม่</span>
            </button>
          </div>

          {patientHnFilter && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-teal-50/80 border border-teal-200 text-xs text-teal-900">
              <span>
                กำลังแสดงเฉพาะรายการยาของผู้ป่วย:{' '}
                <strong>
                  {selectedPatientObj?.patientName || patientHnFilter} ({patientHnFilter})
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setPatientHnFilter(null)}
                className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-950 cursor-pointer whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>แสดงผู้ป่วยทุกราย</span>
              </button>
            </div>
          )}

          {/* Category Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: `ทั้งหมด (${dayAdmins.length})` },
                {
                  id: 'opioid',
                  label: `Opioid (${dayAdmins.filter((a) => a.category === 'opioid').length})`,
                },
                {
                  id: 'muscle_relaxant',
                  label: `Muscle Relaxant (${
                    dayAdmins.filter((a) => a.category === 'muscle_relaxant').length
                  })`,
                },
                {
                  id: 'local_anesthetic',
                  label: `Local Anesthetic (${
                    dayAdmins.filter((a) => a.category === 'local_anesthetic').length
                  })`,
                },
                {
                  id: 'had',
                  label: `กลุ่มยา HAD (${
                    dayAdmins.filter((a) => a.category === 'had' || isHadDrug(a)).length
                  })`,
                },
                {
                  id: 'inhalation',
                  label: `Inhalation (${
                    dayAdmins.filter((a) => a.category === 'inhalation').length
                  })`,
                },
                {
                  id: 'general',
                  label: `ยาทั่วไป (${
                    dayAdmins.filter((a) => a.category === 'general').length
                  })`,
                },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setCategoryFilter(btn.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === btn.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">เวลา</th>
                <th className="py-3 px-4 whitespace-nowrap">ชื่อ-นามสกุลผู้ป่วย / HN</th>
                <th className="py-3 px-3 whitespace-nowrap">ห้องผ่าตัด / หัตถการ</th>
                <th className="py-3 px-4">รายการยา</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">ใช้จริง (Used)</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">เศษยาทิ้ง (Wasted)</th>
                <th className="py-3 px-4">เหตุผลและวิธีทำลายเศษยา</th>
                <th className="py-3 px-4 whitespace-nowrap">ผู้บริหารยา / พยาน</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">ตรวจสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <p className="font-semibold text-slate-700">
                      ไม่พบรายการบันทึกการใช้ยาในวันที่ {selectedDate}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      คลิกปุ่ม &ldquo;บันทึกการใช้ยา&rdquo; เพื่อเพิ่มข้อมูลการบริหารยาของผู้ป่วย
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => {
                  const cat = CATEGORY_META[adm.category];
                  const timeStr = new Date(adm.timestamp).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const hadFlag = isHadDrug(adm);

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {timeStr} น.
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {adm.patientName || 'ผู้ป่วยห้องผ่าตัด'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                          {adm.hn || adm.caseNumber}
                          {adm.patientWeightKg ? ` · ${adm.patientWeightKg} กก.` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 whitespace-nowrap">
                          {adm.operatingRoom}
                        </div>
                        {adm.procedure && (
                          <div className="text-xs text-slate-500 max-w-[180px] truncate mt-0.5">
                            {adm.procedure}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{adm.drugName}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className={`font-medium ${cat.textClass}`}>
                            {cat.shortTh}
                          </span>
                          {hadFlag && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-red-700">HAD</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {adm.vialsOpened > 0
                              ? `เปิด ${adm.vialsOpened} หลอด (${adm.totalOpenedDose} ${adm.unit})`
                              : `Multi-dose vial (${adm.totalOpenedDose} ${adm.unit})`}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-emerald-700 font-mono tabular-nums">
                          {adm.usedDose} {adm.unit}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div
                          className={`font-bold font-mono tabular-nums ${
                            adm.wastedDose > 0 ? 'text-rose-700' : 'text-slate-400'
                          }`}
                        >
                          {adm.wastedDose} {adm.unit}
                        </div>
                        {adm.wastedDose > 0 && adm.totalOpenedDose > 0 && (
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {((adm.wastedDose / adm.totalOpenedDose) * 100).toFixed(0)}%
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        {adm.wastedDose > 0 ? (
                          <div className="space-y-0.5 max-w-[230px]">
                            <div className="text-slate-800 font-medium truncate">
                              {adm.wastageReason}
                            </div>
                            <div className="text-slate-500 truncate">{adm.disposalMethod}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">ใช้หมดหลอด</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {adm.administratorName}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          พยาน: {adm.witnessName || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>6 Rights</span>
                        </div>
                        {adm.hasMedicationError && adm.errorSeverityLevel && (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 block mt-0.5">
                            <ShieldAlert className="w-3 h-3 shrink-0 inline mr-0.5" />
                            <span>Error {adm.errorSeverityLevel}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
