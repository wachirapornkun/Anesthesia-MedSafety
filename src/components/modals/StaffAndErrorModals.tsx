import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  DailyPatientRecord,
  DrugItem,
  MedicationErrorReport,
  NccMerpSeverity,
  StaffMember,
  StaffRole,
} from '../../types';
import {
  ERROR_TYPES,
  getLocalDateString,
  NCC_MERP_LEVELS,
  OPERATING_ROOMS,
  STAFF_ROLE_LABELS,
} from '../../data/catalog';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  onAddStaff: (member: Omit<StaffMember, 'id'>) => void;
  onToggleStaffActive: (id: string) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onAddStaff,
  onToggleStaffActive,
  onDeleteStaff,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('nurse_anesthetist');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [department, setDepartment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddStaff({
      name: name.trim(),
      role,
      licenseNumber: licenseNumber.trim() || '-',
      department: department.trim() || 'งานวิสัญญีวิทยา',
      isActive: true,
    });
    setName('');
    setLicenseNumber('');
    setDepartment('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              จัดการรายชื่อบุคลากรทางวิสัญญี ({staffList.length} ท่าน)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-800">
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="font-semibold text-slate-900 text-xs">
              เพิ่มรายชื่อผู้บริหารยา / พยานตรวจสอบใหม่
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อ-นามสกุล พร้อมคำนำหน้าวิชาชีพ *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="เช่น พญ. จุฬารัตน์ หรือ วพ. สิทธิพร"
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ตำแหน่งวิชาชีพ *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  {(Object.keys(STAFF_ROLE_LABELS) as StaffRole[]).map((r) => (
                    <option key={r} value={r}>
                      {STAFF_ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขใบประกอบวิชาชีพ
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="เช่น ว. 48215 หรือ พย. 102938"
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  สังกัด / ห้องผ่าตัดที่รับผิดชอบ
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="เช่น ประจำ OR 1-4"
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายชื่อบุคลากร</span>
              </button>
            </div>
          </form>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70"
              >
                <div>
                  <div className="font-semibold text-slate-900">{member.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {STAFF_ROLE_LABELS[member.role]} · {member.licenseNumber} ·{' '}
                    {member.department}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleStaffActive(member.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                      member.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {member.isActive ? 'เปิดใช้งาน' : 'พักใช้งาน'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteStaff(member.id)}
                    title="ลบรายชื่อ"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MedErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugs: DrugItem[];
  dailyPatients: DailyPatientRecord[];
  activeOperatorName: string;
  onSubmitError: (payload: Omit<MedicationErrorReport, 'id' | 'timestamp'>) => void;
}

export const MedErrorModal: React.FC<MedErrorModalProps> = ({
  isOpen,
  onClose,
  drugs,
  dailyPatients,
  activeOperatorName,
  onSubmitError,
}) => {
  const [dateString, setDateString] = useState(getLocalDateString());
  const [severityLevel, setSeverityLevel] = useState<NccMerpSeverity>('B');
  const [drugId, setDrugId] = useState('');
  const [errorType, setErrorType] = useState(ERROR_TYPES[0].value);
  const [operatingRoom, setOperatingRoom] = useState(OPERATING_ROOMS[0]);
  const [patientName, setPatientName] = useState('');
  const [hn, setHn] = useState('');
  const [description, setDescription] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [discoveredBy, setDiscoveredBy] = useState(activeOperatorName);

  useEffect(() => {
    if (!isOpen) return;
    setDateString(getLocalDateString());
    setSeverityLevel('B');
    setDrugId(drugs[0]?.id || '');
    setErrorType(ERROR_TYPES[0].value);
    setOperatingRoom(OPERATING_ROOMS[0]);
    setPatientName('');
    setHn('');
    setDescription('');
    setCorrectiveAction('');
    setPreventiveAction('');
    setDiscoveredBy(activeOperatorName);
  }, [isOpen, drugs, activeOperatorName]);

  if (!isOpen) return null;

  const selectedDrug = drugs.find((d) => d.id === drugId) || drugs[0];
  const todaysPatients = dailyPatients.filter((p) => p.dateString === dateString);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug || !description.trim() || !correctiveAction.trim()) return;

    onSubmitError({
      dateString,
      drugId: selectedDrug.id,
      drugName: selectedDrug.name,
      category: selectedDrug.category,
      severityLevel,
      errorType,
      description: description.trim(),
      operatingRoom,
      caseNumber: hn.trim() || undefined,
      patientName: patientName.trim() || undefined,
      hn: hn.trim() || undefined,
      discoveredBy: discoveredBy.trim() || activeOperatorName,
      reportedBy: activeOperatorName,
      correctiveAction: correctiveAction.trim(),
      preventiveAction: preventiveAction.trim(),
      status: 'reported',
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                รายงานอุบัติการณ์ความคลาดเคลื่อนทางยา / Near Miss (NCC MERP A–I)
              </h2>
              <p className="text-xs text-slate-500">
                บันทึกเชิงสร้างสรรค์เพื่อพัฒนาระบบความปลอดภัยทางยาในห้องผ่าตัด
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
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
                ระดับความรุนแรง (NCC MERP) *
              </label>
              <select
                value={severityLevel}
                onChange={(e) => setSeverityLevel(e.target.value as NccMerpSeverity)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ลักษณะความคลาดเคลื่อน *
              </label>
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                {ERROR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ยาที่เกี่ยวข้อง *
              </label>
              <select
                value={drugId}
                onChange={(e) => setDrugId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ห้องผ่าตัดที่เกิดเหตุ *
              </label>
              <select
                value={operatingRoom}
                onChange={(e) => setOperatingRoom(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white"
              >
                {OPERATING_ROOMS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {todaysPatients.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500">เลือกผู้ป่วยวันนี้ (ถ้าเกี่ยวข้อง):</span>
              {todaysPatients.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => {
                    setPatientName(pt.patientName);
                    setHn(pt.hn);
                    setOperatingRoom(pt.operatingRoom);
                  }}
                  className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  {pt.patientName} ({pt.hn})
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อผู้ป่วย (ถ้ามี)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="ไม่บังคับสำหรับระดับ A"
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                HN ผู้ป่วย (ถ้ามี)
              </label>
              <input
                type="text"
                value={hn}
                onChange={(e) => setHn(e.target.value)}
                placeholder="เช่น HN 69-01050"
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              รายละเอียดเหตุการณ์ *
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="อธิบายลำดับเหตุการณ์ที่พบ..."
              className="w-full p-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                การแก้ไขเบื้องต้นทันที *
              </label>
              <textarea
                rows={2}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                required
                placeholder="เช่น เปลี่ยนยาให้ถูกต้องก่อนฉีด..."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                แนวทางป้องกันเชิงระบบ
              </label>
              <textarea
                rows={2}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                placeholder="เช่น แยกถาดวางยา LASA..."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-semibold cursor-pointer"
            >
              บันทึกรายงานอุบัติการณ์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
