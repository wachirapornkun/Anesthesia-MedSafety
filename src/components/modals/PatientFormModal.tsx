import React, { useEffect, useState } from 'react';
import { Trash2, UserPlus, X } from 'lucide-react';
import {
  DailyPatientRecord,
  PatientCaseStatus,
  StaffMember,
} from '../../types';
import {
  ANESTHESIA_TYPES,
  ASA_CLASSES,
  getLocalDateString,
  OPERATING_ROOMS,
} from '../../data/catalog';
import { AggregatedDailyPatient } from '../DailyPatientRosterPanel';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  patientToEdit: AggregatedDailyPatient | null;
  staffList: StaffMember[];
  activeOperatorName: string;
  onSavePatient: (
    payload: Omit<DailyPatientRecord, 'id' | 'createdAt'> & { id?: string }
  ) => void;
  onDeletePatient?: (patientId: string) => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  patientToEdit,
  staffList,
  activeOperatorName,
  onSavePatient,
  onDeletePatient,
}) => {
  const [dateString, setDateString] = useState(defaultDate || getLocalDateString());
  const [patientName, setPatientName] = useState('');
  const [hn, setHn] = useState('');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [asaClass, setAsaClass] = useState('ASA II');
  const [allergy, setAllergy] = useState('ปฏิเสธแพ้ยา (NKDA)');
  const [operatingRoom, setOperatingRoom] = useState(OPERATING_ROOMS[0]);
  const [procedure, setProcedure] = useState('');
  const [anesthesiaType, setAnesthesiaType] = useState(ANESTHESIA_TYPES[0]);
  const [scheduledTime, setScheduledTime] = useState('08:30');
  const [status, setStatus] = useState<PatientCaseStatus>('scheduled');
  const [primaryStaffName, setPrimaryStaffName] = useState(activeOperatorName);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (patientToEdit) {
      setDateString(
        patientToEdit.patientRecord?.dateString || defaultDate || getLocalDateString()
      );
      setPatientName(patientToEdit.patientName);
      setHn(patientToEdit.hn);
      setAge(patientToEdit.age !== undefined ? String(patientToEdit.age) : '');
      setWeightKg(
        patientToEdit.weightKg !== undefined ? String(patientToEdit.weightKg) : ''
      );
      setAsaClass(patientToEdit.asaClass || 'ASA II');
      setAllergy(patientToEdit.allergy || 'ปฏิเสธแพ้ยา (NKDA)');
      setOperatingRoom(patientToEdit.operatingRoom || OPERATING_ROOMS[0]);
      setProcedure(patientToEdit.procedure || '');
      setAnesthesiaType(patientToEdit.anesthesiaType || ANESTHESIA_TYPES[0]);
      setScheduledTime(patientToEdit.firstTime || '08:30');
      setStatus(patientToEdit.status || 'in_or');
      setPrimaryStaffName(patientToEdit.primaryStaffName || activeOperatorName);
      setNotes(patientToEdit.patientRecord?.notes || '');
    } else {
      setDateString(defaultDate || getLocalDateString());
      setPatientName('');
      setHn('');
      setAge('');
      setWeightKg('');
      setAsaClass('ASA II');
      setAllergy('ปฏิเสธแพ้ยา (NKDA)');
      setOperatingRoom(OPERATING_ROOMS[0]);
      setProcedure('');
      setAnesthesiaType(ANESTHESIA_TYPES[0]);
      setScheduledTime(
        new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      );
      setStatus('scheduled');
      setPrimaryStaffName(activeOperatorName);
      setNotes('');
    }
  }, [isOpen, patientToEdit, defaultDate, activeOperatorName]);

  if (!isOpen) return null;

  const activeStaff = staffList.filter((s) => s.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !hn.trim()) return;

    onSavePatient({
      id: patientToEdit?.patientRecord?.id,
      dateString,
      patientName: patientName.trim(),
      hn: hn.trim(),
      age: age ? parseInt(age, 10) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      asaClass,
      allergy: allergy.trim() || 'ปฏิเสธแพ้ยา (NKDA)',
      operatingRoom,
      procedure: procedure.trim() || 'หัตถการระงับความรู้สึกในห้องผ่าตัด',
      anesthesiaType,
      primaryStaffName,
      status,
      scheduledTime,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-700" />
            <div>
              <h2 id="patient-modal-title" className="text-base font-bold text-slate-900">
                {patientToEdit
                  ? 'แก้ไขข้อมูลผู้ป่วยประจำวัน'
                  : 'เพิ่มรายชื่อผู้ป่วยเข้าทะเบียนประจำวัน'}
              </h2>
              <p className="text-xs text-slate-500">
                ระบุชื่อ-นามสกุล HN น้ำหนัก และห้องผ่าตัดเพื่อเตรียมบันทึกการใช้ยาอย่างปลอดภัย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันที่เข้ารับการระงับความรู้สึก *
              </label>
              <input
                type="date"
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เวลาเริ่มเคส / นัดหมาย
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อ-นามสกุลผู้ป่วย *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="เช่น นางสาวชลธิชา แสงทอง"
                required
                className="w-full p-2 rounded-lg border border-slate-300 font-medium"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เลขประจำตัวผู้ป่วย (HN) *
              </label>
              <input
                type="text"
                value={hn}
                onChange={(e) => setHn(e.target.value)}
                placeholder="เช่น HN 69-01088"
                required
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                อายุ (ปี)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="45"
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                น้ำหนัก (กก.)
              </label>
              <input
                type="number"
                min="1"
                max="250"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="60"
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ASA Status
              </label>
              <select
                value={asaClass}
                onChange={(e) => setAsaClass(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
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
                ห้องผ่าตัด (Operating Room)
              </label>
              <select
                value={operatingRoom}
                onChange={(e) => setOperatingRoom(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                {OPERATING_ROOMS.map((rm) => (
                  <option key={rm} value={rm}>
                    {rm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สถานะเคสปัจจุบัน
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientCaseStatus)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="scheduled">รอเริ่มระงับความรู้สึก</option>
                <option value="in_or">กำลังผ่าตัดใน OR</option>
                <option value="pacu">สังเกตอาการ PACU</option>
                <option value="completed">เสร็จสิ้นเคส / ส่งกลับหอผู้ป่วย</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หัตถการผ่าตัด (Surgical Procedure)
            </label>
            <input
              type="text"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="เช่น Exploratory Laparotomy, Cesarean Section, TUR-P"
              className="w-full p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                แผนการระงับความรู้สึก
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
                วิสัญญีแพทย์ / วิสัญญีพยาบาลผู้รับผิดชอบ
              </label>
              <select
                value={primaryStaffName}
                onChange={(e) => setPrimaryStaffName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
              >
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ประวัติแพ้ยา (Drug Allergy)
            </label>
            <input
              type="text"
              value={allergy}
              onChange={(e) => setAllergy(e.target.value)}
              placeholder="ปฏิเสธแพ้ยา (NKDA) หรือระบุชื่อยาที่แพ้"
              className="w-full p-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {patientToEdit?.patientRecord &&
            patientToEdit.administrations.length === 0 &&
            onDeletePatient ? (
              <button
                type="button"
                onClick={() => {
                  onDeletePatient(patientToEdit.patientRecord!.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 text-xs font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายชื่อที่ยังไม่ได้ใช้ยา</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {patientToEdit ? 'บันทึกการแก้ไข' : 'เพิ่มเข้ารายชื่อผู้ป่วยประจำวัน'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
