import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { StaffMember } from '../types';

interface SafetyProtocolBannerProps {
  staffList: StaffMember[];
  activeOperatorName: string;
  onChangeOperator: (name: string) => void;
  onOpenStaffModal: () => void;
  onOpenMedErrorModal: () => void;
  lowStockCount: number;
  unresolvedErrorCount: number;
  onGoToInventoryLowStock: () => void;
  onGoToSafety: () => void;
}

export const SafetyProtocolBanner: React.FC<SafetyProtocolBannerProps> = ({
  staffList,
  activeOperatorName,
  onChangeOperator,
  onOpenStaffModal,
  onOpenMedErrorModal,
  lowStockCount,
  unresolvedErrorCount,
  onGoToInventoryLowStock,
  onGoToSafety,
}) => {
  const [expanded, setExpanded] = useState(false);
  const activeStaff = staffList.filter((s) => s.isActive);

  return (
    <section
      aria-label="แถบเครื่องมือคลินิกและแนวปฏิบัติความปลอดภัยทางยา"
      className="bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>มาตรฐานวิสัญญีปลอดภัย 6 Rights</span>
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>Opioids และยา HAD ต้องมีพยานตรวจสอบร่วม 2 คน</span>
          {lowStockCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <button
                type="button"
                onClick={onGoToInventoryLowStock}
                className="text-amber-800 hover:text-amber-950 font-semibold underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                ยาใกล้หมดสต็อก {lowStockCount} รายการ
              </button>
            </>
          )}
          {unresolvedErrorCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <button
                type="button"
                onClick={onGoToSafety}
                className="text-rose-700 hover:text-rose-900 font-semibold underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                รายงานรอทบทวน {unresolvedErrorCount} เคส
              </button>
            </>
          )}
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-medium underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{expanded ? 'ซ่อนแนวปฏิบัติ' : 'ดูแนวปฏิบัติ 6 Rights & ทำลายเศษยา'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <label htmlFor="operator-select" className="text-slate-500 whitespace-nowrap">
              ผู้ปฏิบัติงาน:
            </label>
            <select
              id="operator-select"
              value={activeOperatorName}
              onChange={(e) => onChangeOperator(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            >
              {activeStaff.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenStaffModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>บุคลากร ({staffList.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenMedErrorModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 text-rose-800 font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>แจ้ง Med Error</span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-slate-900">
              หลักความปลอดภัย 6 Rights ทางวิสัญญีวิทยา
            </h3>
            <ul className="space-y-1 leading-relaxed">
              <li>
                <strong className="text-slate-800">1. Right Patient:</strong>{' '}
                ตรวจสอบชื่อ-นามสกุล HN น้ำหนัก และประวัติแพ้ยาของผู้ป่วยทุกรายก่อนให้ยา
              </li>
              <li>
                <strong className="text-slate-800">2. Right Drug:</strong>{' '}
                ตรวจสอบชื่อสามัญ ความเข้มข้น และสีฉลากกระบอกฉีดยามาตรฐานวิสัญญี
              </li>
              <li>
                <strong className="text-slate-800">3. Right Dose:</strong>{' '}
                คำนวณขนาดยา (mg/kg หรือ mcg/kg) ให้สอดคล้องกับน้ำหนักและ ASA Status
              </li>
              <li>
                <strong className="text-slate-800">4. Right Route:</strong>{' '}
                ตรวจสอบช่องทางบริหารยา (IV, Spinal, Epidural, Nerve Block, Inhalation)
              </li>
              <li>
                <strong className="text-slate-800">5. Right Time:</strong>{' '}
                บันทึกเวลาจริงตามลำดับ Induction, Maintenance และ Emergence/Reversal
              </li>
              <li>
                <strong className="text-slate-800">6. Right Documentation & Witness:</strong>{' '}
                ลงบันทึกชื่อผู้ป่วย ปริมาณใช้จริง และเศษยาทิ้ง พร้อมพยานตรวจสอบร่วม
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-slate-900">
              ระเบียบการจัดการเศษยาเหลือทิ้ง (Drug Wastage Protocol)
            </h3>
            <ul className="space-y-1 leading-relaxed">
              <li>
                <strong className="text-slate-800">กลุ่ม Opioids (ยาเสพติดประเภท 2):</strong>{' '}
                เมื่อเปิดแอมพูลแล้วใช้ไม่หมด ต้องทำลายเศษยาต่อหน้าพยานวิสัญญีแพทย์หรือวิสัญญีพยาบาล
              </li>
              <li>
                <strong className="text-slate-800">สมดุลปริมาณยา:</strong>{' '}
                ผลรวมของ ปริมาณที่ใช้จริง (Used) + ปริมาณที่ทิ้ง (Wasted) ต้องเท่ากับขนาดบรรจุรวมของหลอดที่เปิด
              </li>
              <li>
                <strong className="text-slate-800">Ketamine 10 ml Multi-Dose Vial:</strong>{' '}
                บันทึกยอดสะสมตามรายชื่อผู้ป่วยที่ใช้จริงจนครบ 10 ml ก่อนส่งคืนขวดเปล่าเพื่อเบิกขวดใหม่
              </li>
              <li>
                <strong className="text-slate-800">การตรวจสอบย้อนกลับรายผู้ป่วย:</strong>{' '}
                ตรวจสอบรายชื่อผู้ป่วยที่ใช้ยาประจำวันเทียบกับสมุดควบคุมยาเสพติดหลังจบเวรทุกวัน
              </li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
