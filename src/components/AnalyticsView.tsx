import React, { useMemo, useState } from 'react';
import { DrugAdministration, DrugCategory } from '../types';
import { CATEGORY_META, getShiftedDateString } from '../data/catalog';

interface AnalyticsViewProps {
  administrations: DrugAdministration[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ administrations }) => {
  const [range, setRange] = useState<'7days' | '30days' | 'all'>('30days');

  const scopedAdmins = useMemo(() => {
    if (range === 'all') return administrations;
    const days = range === '7days' ? 7 : 30;
    const cutoff = getShiftedDateString(-(days - 1));
    return administrations.filter((a) => a.dateString >= cutoff);
  }, [administrations, range]);

  const sevenDayTrend = useMemo(() => {
    const items: {
      date: string;
      shortDate: string;
      patients: number;
      vials: number;
      opioidCount: number;
    }[] = [];

    for (let offset = -6; offset <= 0; offset++) {
      const dStr = getShiftedDateString(offset);
      const dayList = administrations.filter((a) => a.dateString === dStr);
      const ptSet = new Set(
        dayList.map((a) => (a.hn || a.caseNumber || a.patientName).trim().toLowerCase())
      );
      const vials = dayList.reduce((s, a) => s + (a.vialsOpened || 1), 0);
      const opioidCount = dayList.filter((a) => a.category === 'opioid').length;
      items.push({
        date: dStr,
        shortDate: dStr.slice(5),
        patients: ptSet.size,
        vials,
        opioidCount,
      });
    }
    return items;
  }, [administrations]);

  const maxDailyVials = Math.max(1, ...sevenDayTrend.map((d) => d.vials));

  const categoryBreakdown = useMemo(() => {
    const order: DrugCategory[] = [
      'opioid',
      'muscle_relaxant',
      'local_anesthetic',
      'had',
      'inhalation',
      'general',
    ];
    const totalCount = Math.max(1, scopedAdmins.length);

    return order.map((cat) => {
      const list = scopedAdmins.filter((a) => a.category === cat);
      const ptSet = new Set(
        list.map((a) => (a.hn || a.caseNumber || a.patientName).trim().toLowerCase())
      );
      const vials = list.reduce((s, a) => s + (a.vialsOpened || 0), 0);
      return {
        category: cat,
        meta: CATEGORY_META[cat],
        count: list.length,
        patients: ptSet.size,
        vials,
        sharePct: ((list.length / totalCount) * 100).toFixed(0),
      };
    });
  }, [scopedAdmins]);

  const roomStats = useMemo(() => {
    const map = new Map<
      string,
      {
        room: string;
        patients: Set<string>;
        admins: number;
        vials: number;
        drugFreq: Map<string, number>;
      }
    >();

    for (const adm of scopedAdmins) {
      const room = adm.operatingRoom || 'ห้องผ่าตัดทั่วไป (OR)';
      const entry = map.get(room) || {
        room,
        patients: new Set<string>(),
        admins: 0,
        vials: 0,
        drugFreq: new Map<string, number>(),
      };
      entry.patients.add(
        (adm.hn || adm.caseNumber || adm.patientName).trim().toLowerCase()
      );
      entry.admins += 1;
      entry.vials += adm.vialsOpened || 0;
      entry.drugFreq.set(adm.drugName, (entry.drugFreq.get(adm.drugName) || 0) + 1);
      map.set(room, entry);
    }

    return Array.from(map.values())
      .map((r) => {
        let topDrug = '-';
        let topCount = 0;
        r.drugFreq.forEach((cnt, name) => {
          if (cnt > topCount) {
            topCount = cnt;
            topDrug = name.split('(')[0].trim();
          }
        });
        return {
          room: r.room,
          patientCount: r.patients.size,
          admins: r.admins,
          vials: r.vials,
          topDrug,
        };
      })
      .sort((a, b) => b.patientCount - a.patientCount || b.admins - a.admins);
  }, [scopedAdmins]);

  const topWastedDrugs = useMemo(() => {
    const map = new Map<
      string,
      { name: string; unit: string; wasted: number; opened: number; cases: number }
    >();
    for (const adm of scopedAdmins) {
      if (adm.wastedDose <= 0) continue;
      const item = map.get(adm.drugName) || {
        name: adm.drugName,
        unit: adm.unit,
        wasted: 0,
        opened: 0,
        cases: 0,
      };
      item.wasted = parseFloat((item.wasted + adm.wastedDose).toFixed(2));
      item.opened = parseFloat((item.opened + adm.totalOpenedDose).toFixed(2));
      item.cases += 1;
      map.set(adm.drugName, item);
    }
    return Array.from(map.values())
      .sort((a, b) => b.cases - a.cases || b.wasted - a.wasted)
      .slice(0, 6);
  }, [scopedAdmins]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            วิเคราะห์ข้อมูลการใช้ยาและจำนวนผู้ป่วยตามห้องผ่าตัด
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สรุปความถี่การใช้ยาแต่ละกลุ่ม ปริมาณผู้ป่วยต่อวัน และรายการยาที่มีเศษเหลือทำลายสูงสุด
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          {(
            [
              { id: '7days', label: '7 วันล่าสุด' },
              { id: '30days', label: '30 วันล่าสุด' },
              { id: 'all', label: 'ข้อมูลทั้งหมด' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                range === opt.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Split: 7-Day Trend + Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              แนวโน้มผู้ป่วยและหลอดยาที่เปิดใช้ย้อนหลัง 7 วัน
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบจำนวนผู้ป่วยที่ใช้ยา (ราย) และจำนวนหลอดยาที่เปิดใช้ในแต่ละวัน
            </p>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2.5 items-end h-52 pt-4 border-b border-slate-200">
            {sevenDayTrend.map((day) => {
              const barPct = Math.max(
                day.vials > 0 ? 12 : 3,
                Math.round((day.vials / maxDailyVials) * 100)
              );
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center justify-end h-full gap-1.5"
                >
                  <div className="text-[11px] font-mono tabular-nums text-slate-600 font-semibold">
                    {day.patients > 0 ? `${day.patients} ราย` : '-'}
                  </div>
                  <div className="w-full max-w-[38px] bg-slate-100 rounded-t-md h-36 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-teal-700 rounded-t-md transition-opacity"
                      style={{ height: `${barPct}%` }}
                      title={`${day.date}: ผู้ป่วย ${day.patients} ราย, เปิดยา ${day.vials} หลอด`}
                    />
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-500 pb-2">
                    {day.shortDate}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
            <span>
              รวม 7 วัน: ผู้ป่วยใช้ยา{' '}
              {sevenDayTrend.reduce((s, d) => s + d.patients, 0)} ราย-วัน
            </span>
            <span>
              เปิดยารวม {sevenDayTrend.reduce((s, d) => s + d.vials, 0)} หลอด/ขวด
            </span>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            สัดส่วนการบริหารยาแยกตามกลุ่มเภสัชวิทยา
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">
            แสดงจำนวนผู้ป่วยที่ได้รับยา จำนวนครั้งที่บริหาร และสัดส่วนต่อทั้งหมด
          </p>

          <div className="space-y-4">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${item.meta.textClass}`}>
                    {item.meta.shortTh}
                  </span>
                  <span className="font-mono tabular-nums text-slate-600">
                    ผู้ป่วย {item.patients} ราย · {item.count} ครั้ง ({item.sharePct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-slate-800 rounded-full"
                    style={{ width: `${Math.min(100, Number(item.sharePct))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Operating Room Patient Volume & Top Wasted Drugs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              ปริมาณผู้ป่วยและการใช้ยาแยกตามห้องผ่าตัด (OR Utilization)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">ห้องผ่าตัด</th>
                  <th className="py-2.5 px-3 text-center">ผู้ป่วย (ราย)</th>
                  <th className="py-2.5 px-3 text-center">รายการยา</th>
                  <th className="py-2.5 px-4">ยาที่ใช้บ่อยสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      ยังไม่มีข้อมูลในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  roomStats.map((r) => (
                    <tr key={r.room} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.room}</td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-teal-800">
                        {r.patientCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                        {r.admins}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{r.topDrug}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              รายการยาที่มีการทำลายเศษยาเหลือทิ้งบ่อยที่สุด
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">รายการยา</th>
                  <th className="py-2.5 px-3 text-center">จำนวนครั้งที่ทิ้ง</th>
                  <th className="py-2.5 px-4 text-right">ปริมาณเศษยาทิ้งรวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topWastedDrugs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 text-xs">
                      ไม่มีเศษยาเหลือทิ้งในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                ) : (
                  topWastedDrugs.map((w) => {
                    const pct =
                      w.opened > 0 ? ((w.wasted / w.opened) * 100).toFixed(0) : '0';
                    return (
                      <tr key={w.name} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">{w.name}</td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                          {w.cases} ครั้ง
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-rose-700">
                          {w.wasted} {w.unit} ({pct}%)
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
    </div>
  );
};
