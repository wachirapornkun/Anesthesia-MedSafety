import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Syringe,
} from 'lucide-react';
import {
  DailyPatientRecord,
  DrugAdministration,
  DrugCategory,
  DrugItem,
} from '../types';
import { CATEGORY_META, isHadDrug } from '../data/catalog';
import {
  AggregatedDailyPatient,
  DailyPatientRosterPanel,
} from './DailyPatientRosterPanel';

interface InventoryViewProps {
  drugs: DrugItem[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  dailyPatients: DailyPatientRecord[];
  administrations: DrugAdministration[];
  initialLowStockOnly?: boolean;
  onRecordDrug: (drugId: string) => void;
  onAddDrugForPatient: (patient: AggregatedDailyPatient) => void;
  onOpenNewPatientModal: (dateString: string) => void;
  onEditPatientModal: (patient: AggregatedDailyPatient) => void;
  onNavigateFullDailyView: () => void;
  onRestockDrug: (drug: DrugItem) => void;
  onEditDrug: (drug: DrugItem) => void;
  onOpenAddDrug: (category: DrugCategory) => void;
  onResetMultiDoseVial: (drugId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  drugs,
  selectedDate,
  onChangeDate,
  dailyPatients,
  administrations,
  initialLowStockOnly = false,
  onRecordDrug,
  onAddDrugForPatient,
  onOpenNewPatientModal,
  onEditPatientModal,
  onNavigateFullDailyView,
  onRestockDrug,
  onEditDrug,
  onOpenAddDrug,
  onResetMultiDoseVial,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DrugCategory>('all');
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStockOnly);

  const lowStockDrugs = useMemo(
    () => drugs.filter((d) => d.stockCount <= d.minAlertStock),
    [drugs]
  );

  const ketamineDrug = useMemo(
    () =>
      drugs.find(
        (d) => d.isMultiDoseVial || d.name.toLowerCase().includes('ketamine')
      ),
    [drugs]
  );

  const countsByCategory = useMemo(() => {
    const sumStock = (cat: DrugCategory) =>
      drugs
        .filter((d) => d.category === cat)
        .reduce((acc, item) => acc + item.stockCount, 0);

    return {
      opioid: sumStock('opioid'),
      muscle_relaxant: sumStock('muscle_relaxant'),
      local_anesthetic: sumStock('local_anesthetic'),
      had: drugs
        .filter((d) => d.category === 'had' || isHadDrug(d))
        .reduce((acc, item) => acc + item.stockCount, 0),
      hadItemCount: drugs.filter((d) => d.category === 'had' || isHadDrug(d)).length,
      inhalation: sumStock('inhalation'),
    };
  }, [drugs]);

  const filteredDrugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return drugs.filter((d) => {
      if (lowStockOnly && d.stockCount > d.minAlertStock) return false;
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'had') {
          if (!(d.category === 'had' || isHadDrug(d))) return false;
        } else if (d.category !== categoryFilter) {
          return false;
        }
      }
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.genericName.toLowerCase().includes(q) ||
        (d.subCategory && d.subCategory.toLowerCase().includes(q)) ||
        (d.lotNumber && d.lotNumber.toLowerCase().includes(q))
      );
    });
  }, [drugs, lowStockOnly, categoryFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Compact Daily Patient Medication Roster right at the top of Inventory */}
      <DailyPatientRosterPanel
        compact
        selectedDate={selectedDate}
        onChangeDate={onChangeDate}
        dailyPatients={dailyPatients}
        administrations={administrations}
        onAddDrugForPatient={onAddDrugForPatient}
        onOpenNewPatientModal={onOpenNewPatientModal}
        onEditPatientModal={onEditPatientModal}
        onNavigateFullDailyView={onNavigateFullDailyView}
      />

      {/* 6-Column Inventory Summary Strip */}
      <section
        aria-label="สรุปยอดคงเหลือคลังยาแยกตามหมวดหมู่"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5"
      >
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-semibold text-rose-800">กลุ่ม Opioids</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {countsByCategory.opioid}
            </span>
            <span className="text-xs text-slate-500">หลอด/ขวด</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">รวม Morphine & Ketamine</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-semibold text-amber-800">Muscle Relaxants</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {countsByCategory.muscle_relaxant}
            </span>
            <span className="text-xs text-slate-500">หลอด</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Roc · Cis · Atra · Suc</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-semibold text-emerald-800">Local Anesthetics</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {countsByCategory.local_anesthetic}
            </span>
            <span className="text-xs text-slate-500">ขวด/หลอด</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Xylocaine · Marcaine</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-semibold text-red-700">กลุ่มยา HAD</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-red-700 font-mono tabular-nums">
              {countsByCategory.had}
            </span>
            <span className="text-xs text-slate-500">หลอด</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {countsByCategory.hadItemCount} รายการความเสี่ยงสูง
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <div className="text-xs font-semibold text-indigo-800">Inhalation</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {countsByCategory.inhalation}
            </span>
            <span className="text-xs text-slate-500">ขวด</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sevoflurane · Desflurane</div>
        </div>

        <button
          type="button"
          onClick={() => setLowStockOnly((prev) => !prev)}
          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            lowStockOnly
              ? 'bg-amber-50 border-amber-300'
              : lowStockDrugs.length > 0
              ? 'bg-white border-amber-300 hover:bg-amber-50/40'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold text-amber-800">สต็อกใกล้หมด</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-800 font-mono tabular-nums">
              {lowStockDrugs.length}
            </span>
            <span className="text-xs text-slate-600">
              {lowStockOnly ? '(แสดงทั้งหมด)' : 'รายการ'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">คลิกเพื่อกรองยาต้องเบิกเติม</div>
        </button>
      </section>

      {/* Low Stock Alert Strip */}
      {lowStockDrugs.length > 0 && !lowStockOnly && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              พบยาต่ำกว่าจุดสั่งเบิก (Reorder Point) <strong>{lowStockDrugs.length} รายการ</strong>:{' '}
              {lowStockDrugs
                .map((d) => `${d.name} (เหลือ ${d.stockCount})`)
                .join(' · ')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLowStockOnly(true)}
            className="text-xs font-semibold text-amber-900 underline underline-offset-2 whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            กรองเฉพาะยาใกล้หมด
          </button>
        </div>
      )}

      {/* Ketamine 10 ml Multi-Dose Vial Tracker */}
      {ketamineDrug && (categoryFilter === 'all' || categoryFilter === 'opioid') && (
        <section
          aria-label="ติดตามขวดเปิดใช้งาน Ketamine 10 ml"
          className="p-5 rounded-xl bg-white border border-slate-200 space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-rose-700 font-semibold">
                วัตถุออกฤทธิ์ต่อจิตประสาทประเภท 2 · ขวดเปิดใช้งานสะสมรายผู้ป่วย (Multi-Dose Vial)
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {ketamineDrug.name} — สะสมการใช้ครบ 10 ml จึงส่งคืนขวดเปล่าเบิกขวดใหม่เข้า Stock
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onRecordDrug(ketamineDrug.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>บันทึกใช้ Ketamine</span>
              </button>
              <button
                type="button"
                onClick={() => onResetMultiDoseVial(ketamineDrug.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {(ketamineDrug.activeVialUsed ?? 0) >= (ketamineDrug.vialCapacity ?? 10)
                    ? 'ส่งคืนขวดเปล่า & เปิดขวดใหม่ (ครบ 10 ml)'
                    : 'เปลี่ยน/รีเซ็ตขวดใหม่'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-slate-600">
                ใช้สะสมในขวดปัจจุบัน:{' '}
                <strong className="text-slate-900">
                  {ketamineDrug.activeVialUsed ?? 0} / {ketamineDrug.vialCapacity ?? 10} ml
                </strong>
              </span>
              <span className="text-teal-800 font-semibold">
                คงเหลือในขวดเปิดใช้: {ketamineDrug.activeVialRemaining ?? 10} ml · สต็อกเต็ม:{' '}
                {ketamineDrug.stockCount} ขวด
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-teal-600 rounded-full transition-opacity"
                style={{
                  width: `${Math.min(
                    100,
                    ((ketamineDrug.activeVialUsed ?? 0) /
                      (ketamineDrug.vialCapacity || 10)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Main Drug Catalog Table */}
      <section
        aria-label="ตารางคลังสต็อกยาวิสัญญีทั้งหมด"
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                คลังสต็อกยาทางวิสัญญีวิทยา ({filteredDrugs.length} รายการ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ตรวจสอบยอดคงเหลือ ความเข้มข้น Lot / วันหมดอายุ และตัดจ่ายให้ผู้ป่วยแบบ Real-time
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenAddDrug(categoryFilter === 'all' ? 'opioid' : categoryFilter)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการยาใหม่</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อยาการค้า, ชื่อสามัญ (Generic) หรือหมายเลข Lot..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'all', label: `ทั้งหมด (${drugs.length})` },
                  {
                    id: 'opioid',
                    label: `Opioid (${drugs.filter((d) => d.category === 'opioid').length})`,
                  },
                  {
                    id: 'muscle_relaxant',
                    label: `Muscle Relaxant (${
                      drugs.filter((d) => d.category === 'muscle_relaxant').length
                    })`,
                  },
                  {
                    id: 'local_anesthetic',
                    label: `Local (${
                      drugs.filter((d) => d.category === 'local_anesthetic').length
                    })`,
                  },
                  {
                    id: 'had',
                    label: `HAD (${
                      drugs.filter((d) => d.category === 'had' || isHadDrug(d)).length
                    })`,
                  },
                  {
                    id: 'inhalation',
                    label: `Inhalation (${
                      drugs.filter((d) => d.category === 'inhalation').length
                    })`,
                  },
                  {
                    id: 'general',
                    label: `ยาทั่วไป (${
                      drugs.filter((d) => d.category === 'general').length
                    })`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === tab.id
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">รายการยา / ชื่อสามัญ</th>
                <th className="py-3 px-3 whitespace-nowrap">หมวดหมู่</th>
                <th className="py-3 px-3">ความเข้มข้น / ขนาดบรรจุ</th>
                <th className="py-3 px-3 whitespace-nowrap">Lot / วันหมดอายุ</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">คงเหลือในสต็อก</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrugs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-500">
                    ไม่พบรายการยาที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredDrugs.map((drug) => {
                  const cat = CATEGORY_META[drug.category];
                  const isLow = drug.stockCount <= drug.minAlertStock;
                  const hadFlag = isHadDrug(drug);

                  return (
                    <tr key={drug.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">{drug.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {drug.genericName}
                          {drug.subCategory ? ` · ${drug.subCategory}` : ''}
                        </div>
                        {drug.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                            {drug.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className={`text-xs font-semibold ${cat.textClass}`}>
                          {cat.shortTh}
                        </div>
                        {hadFlag && (
                          <div className="text-[11px] font-bold text-red-700 mt-0.5">
                            High Alert (HAD)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 align-top text-xs">
                        <div className="font-mono tabular-nums text-slate-700">
                          {drug.concentration}
                        </div>
                        <div className="font-mono tabular-nums text-slate-400 mt-0.5">
                          ขนาดเปิด: {drug.standardVialDose} {drug.unit}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top text-xs font-mono tabular-nums whitespace-nowrap">
                        <div className="text-slate-700">{drug.lotNumber || '-'}</div>
                        <div className="text-slate-400 mt-0.5">
                          EXP: {drug.expiryDate || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top text-right whitespace-nowrap">
                        <div
                          className={`text-base font-bold font-mono tabular-nums ${
                            isLow ? 'text-amber-700' : 'text-slate-900'
                          }`}
                        >
                          {drug.stockCount}{' '}
                          <span className="text-xs font-normal text-slate-500 font-sans">
                            {drug.unit === 'ml' ? 'ขวด/หลอด' : 'หลอด'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                          เกณฑ์ขั้นต่ำ {drug.minAlertStock}
                          {isLow ? ' · ต้องเบิกเพิ่ม' : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRecordDrug(drug.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Syringe className="w-3.5 h-3.5" />
                            <span>ใช้ยา</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRestockDrug(drug)}
                            title="รับยาเข้า / ปรับสต็อก"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <PackagePlus className="w-3.5 h-3.5 text-slate-500" />
                            <span>รับเข้า</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditDrug(drug)}
                            title="แก้ไขข้อมูลยา"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
