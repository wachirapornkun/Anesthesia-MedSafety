import React, { useMemo, useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { DrugAdministration, DrugCategory } from '../types';
import { CATEGORY_META, getLocalDateString, isHadDrug } from '../data/catalog';

interface MonthlySummaryViewProps {
  administrations: DrugAdministration[];
}

export const MonthlySummaryView: React.FC<MonthlySummaryViewProps> = ({
  administrations,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getLocalDateString().slice(0, 7)
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | DrugCategory>('all');

  const monthAdmins = useMemo(
    () => administrations.filter((a) => a.monthString === selectedMonth),
    [administrations, selectedMonth]
  );

  const uniquePatientsInMonth = useMemo(() => {
    const s = new Set(
      monthAdmins.map((a) => (a.hn || a.caseNumber || a.patientName).trim().toLowerCase())
    );
    return s.size;
  }, [monthAdmins]);

  const drugRows = useMemo(() => {
    const map = new Map<
      string,
      {
        drugName: string;
        category: DrugCategory;
        isHad: boolean;
        unit: string;
        adminCount: number;
        patientSet: Set<string>;
        vialsOpened: number;
        totalOpenedDose: number;
        usedDose: number;
        wastedDose: number;
      }
    >();

    for (const adm of monthAdmins) {
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'had') {
          if (!(adm.category === 'had' || isHadDrug(adm))) continue;
        } else if (adm.category !== categoryFilter) {
          continue;
        }
      }

      const existing = map.get(adm.drugName) || {
        drugName: adm.drugName,
        category: adm.category,
        isHad: isHadDrug(adm),
        unit: adm.unit,
        adminCount: 0,
        patientSet: new Set<string>(),
        vialsOpened: 0,
        totalOpenedDose: 0,
        usedDose: 0,
        wastedDose: 0,
      };

      existing.adminCount += 1;
      existing.patientSet.add(
        (adm.hn || adm.caseNumber || adm.patientName).trim().toLowerCase()
      );
      existing.vialsOpened += adm.vialsOpened || 0;
      existing.totalOpenedDose = parseFloat(
        (existing.totalOpenedDose + (adm.totalOpenedDose || 0)).toFixed(2)
      );
      existing.usedDose = parseFloat((existing.usedDose + (adm.usedDose || 0)).toFixed(2));
      existing.wastedDose = parseFloat(
        (existing.wastedDose + (adm.wastedDose || 0)).toFixed(2)
      );
      map.set(adm.drugName, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.adminCount - a.adminCount);
  }, [monthAdmins, categoryFilter]);

  const handleExportMonthlyCsv = () => {
    const headers = [
      'ประจำเดือน',
      'รายการยา',
      'กลุ่มยา',
      'จำนวนผู้ป่วยที่ใช้ (ราย)',
      'จำนวนครั้งที่บริหารยา',
      'หลอดที่เปิดรวม',
      'ขนาดเปิดรวม',
      'ปริมาณที่ใช้จริง (Used)',
      'ปริมาณที่ทิ้ง (Wasted)',
      'หน่วย',
      '% ทิ้งยา',
    ];
    const rows = drugRows.map((r) => {
      const pct =
        r.totalOpenedDose > 0
          ? ((r.wastedDose / r.totalOpenedDose) * 100).toFixed(1)
          : '0.0';
      return [
        selectedMonth,
        r.drugName,
        CATEGORY_META[r.category].shortTh,
        r.patientSet.size,
        r.adminCount,
        r.vialsOpened,
        r.totalOpenedDose,
        r.usedDose,
        r.wastedDose,
        r.unit,
        `${pct}%`,
      ];
    });

    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `สรุปการใช้ยารายเดือน_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            สรุปยอดการใช้ยาและจำนวนผู้ป่วยรายเดือน
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ประจำเดือน <span className="font-mono tabular-nums">{selectedMonth}</span> ·
            ผู้ป่วยที่ได้รับยารวม{' '}
            <strong className="font-mono tabular-nums text-slate-800">
              {uniquePatientsInMonth} ราย
            </strong>{' '}
            · บันทึกการให้ยารวม{' '}
            <strong className="font-mono tabular-nums text-slate-800">
              {monthAdmins.length} ครั้ง
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="เลือกเดือน"
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            />
          </div>

          <button
            type="button"
            onClick={handleExportMonthlyCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ส่งออกรายงานรายเดือน CSV</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg overflow-x-auto w-fit max-w-full">
        {(
          [
            { id: 'all', label: 'ทุกกลุ่มยา' },
            { id: 'opioid', label: 'Opioids' },
            { id: 'muscle_relaxant', label: 'Muscle Relaxants' },
            { id: 'local_anesthetic', label: 'Local Anesthetics' },
            { id: 'had', label: 'กลุ่มยา HAD' },
            { id: 'inhalation', label: 'Inhalation' },
            { id: 'general', label: 'ยาทั่วไป' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">รายการยา</th>
                <th className="py-3 px-3 whitespace-nowrap">กลุ่มยา</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">ผู้ป่วยที่ใช้</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">จำนวนครั้ง</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">หลอดที่เปิด</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">ขนาดเปิดรวม</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">ปริมาณใช้จริง</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">ปริมาณที่ทิ้ง</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">% ทิ้งยา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drugRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-500">
                    ไม่พบข้อมูลการใช้ยาในเดือน {selectedMonth}
                  </td>
                </tr>
              ) : (
                drugRows.map((row) => {
                  const cat = CATEGORY_META[row.category];
                  const pct =
                    row.totalOpenedDose > 0
                      ? ((row.wastedDose / row.totalOpenedDose) * 100).toFixed(1)
                      : '0.0';
                  const highWastage = parseFloat(pct) > 30 && row.category !== 'inhalation';

                  return (
                    <tr key={row.drugName} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {row.drugName}
                        {row.isHad && (
                          <span className="ml-2 text-[11px] font-bold text-red-700">
                            · HAD
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-3 text-xs font-medium ${cat.textClass}`}>
                        {cat.shortTh}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-teal-800">
                        {row.patientSet.size} ราย
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.adminCount} ครั้ง
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-slate-900">
                        {row.vialsOpened}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                        {row.totalOpenedDose.toLocaleString()} {row.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                        {row.usedDose.toLocaleString()} {row.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-rose-700">
                        {row.wastedDose.toLocaleString()} {row.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            highWastage ? 'text-rose-700' : 'text-slate-700'
                          }`}
                        >
                          {row.category === 'inhalation' ? '-' : `${pct}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
