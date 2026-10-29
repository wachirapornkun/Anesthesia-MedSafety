import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  ErrorIncidentStatus,
  MedicationErrorReport,
  NccMerpSeverity,
  StockAuditLog,
  StockChangeType,
} from '../types';
import { NCC_MERP_LEVELS } from '../data/catalog';

interface SafetyAndAuditViewProps {
  errors: MedicationErrorReport[];
  auditLogs: StockAuditLog[];
  onOpenReportModal: () => void;
  onUpdateErrorStatus: (id: string, status: ErrorIncidentStatus) => void;
}

export const SafetyAndAuditView: React.FC<SafetyAndAuditViewProps> = ({
  errors,
  auditLogs,
  onOpenReportModal,
  onUpdateErrorStatus,
}) => {
  const [subView, setSubView] = useState<'errors' | 'audit'>('errors');
  const [severityFilter, setSeverityFilter] = useState<'all' | NccMerpSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ErrorIncidentStatus>('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'all' | StockChangeType>('all');

  const filteredErrors = errors.filter((e) => {
    if (severityFilter !== 'all' && e.severityLevel !== severityFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (auditTypeFilter !== 'all' && log.changeType !== auditTypeFilter) return false;
    const q = auditSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      log.drugName.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      (log.patientName && log.patientName.toLowerCase().includes(q)) ||
      (log.hn && log.hn.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-navigation toggle */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubView('errors')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subView === 'errors'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>อุบัติการณ์ความคลาดเคลื่อนทางยา (NCC MERP A–I)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('audit')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subView === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-teal-700" />
            <span>ประวัติเคลื่อนไหวสต็อกยา ({auditLogs.length})</span>
          </button>
        </div>

        {subView === 'errors' && (
          <button
            type="button"
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกรายงานความคลาดเคลื่อน / Near Miss</span>
          </button>
        )}
      </div>

      {subView === 'errors' ? (
        <>
          {/* NCC MERP Reference Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>กลุ่ม 1: เสี่ยงเกิดความคลาดเคลื่อน</span>
                <span className="font-mono tabular-nums text-slate-500">ระดับ A</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                พบสภาพแวดล้อมหรือการจัดวางยาที่เสี่ยงต่อความผิดพลาด เช่น ยา LASA วางติดกันในถาดหรือตู้เย็น
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-800">
                <span>กลุ่ม 2: เกิดความคลาดเคลื่อน แต่ไม่เป็นอันตราย</span>
                <span className="font-mono tabular-nums text-sky-700">ระดับ B – D</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระดับ B: Near Miss ตรวจพบก่อนฉีด · ระดับ C–D: ยาถึงผู้ป่วยและเฝ้าระวังอาการอย่างปลอดภัย
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span>กลุ่ม 3: เกิดอันตรายต่อผู้ป่วย / ร้ายแรง</span>
                <span className="font-mono tabular-nums text-rose-700">ระดับ E – I</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระดับ E–F: ต้องให้ยาต้านฤทธิ์หรือนอน รพ. นานขึ้น · ระดับ G–I: อันตรายถาวร ช่วยฟื้นคืนชีพ หรือ Sentinel Event
              </p>
            </div>
          </div>

          {/* Filter & Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">กรองระดับความรุนแรง:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as 'all' | NccMerpSeverity)}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
                >
                  <option value="all">ทุกระดับ (A ถึง I)</option>
                  {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as NccMerpSeverity[]).map(
                    (lvl) => (
                      <option key={lvl} value={lvl}>
                        ระดับ {lvl} — {NCC_MERP_LEVELS[lvl].groupTh}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">สถานะการทบทวน:</span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | ErrorIncidentStatus)
                  }
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="reported">รอการทบทวน (Reported)</option>
                  <option value="reviewed">ทบทวนแล้ว (Reviewed)</option>
                  <option value="resolved">แก้ไขเชิงระบบแล้ว (Resolved)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">วันที่ / เวลา</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">NCC MERP</th>
                    <th className="py-3 px-4">ยา / ผู้ป่วย / ห้องผ่าตัด</th>
                    <th className="py-3 px-4">รายละเอียดเหตุการณ์</th>
                    <th className="py-3 px-4">การแก้ไขและแนวทางป้องกัน</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredErrors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center text-slate-500">
                        ไม่พบรายงานความคลาดเคลื่อนทางยาตามตัวกรองที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredErrors.map((err) => {
                      const info = NCC_MERP_LEVELS[err.severityLevel];
                      const dtStr = new Date(err.timestamp).toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      });

                      return (
                        <tr key={err.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap align-top">
                            {dtStr}
                          </td>
                          <td className="py-3.5 px-3 text-center align-top whitespace-nowrap">
                            <div className={`font-mono font-bold text-sm ${info.textClass}`}>
                              ระดับ {err.severityLevel}
                            </div>
                            <div className="text-[11px] text-slate-400">{info.group}</div>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-slate-900">{err.drugName}</div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              {err.operatingRoom}
                            </div>
                            {(err.patientName || err.hn || err.caseNumber) && (
                              <div className="text-xs text-teal-800 font-medium mt-0.5 font-mono tabular-nums">
                                {err.patientName ? `${err.patientName} · ` : ''}
                                {err.hn || err.caseNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs align-top">
                            <div className="text-slate-800 leading-relaxed max-w-sm">
                              {err.description}
                            </div>
                            <div className="text-slate-500 mt-1">
                              ผู้ตรวจพบ: <strong className="text-slate-700">{err.discoveredBy}</strong>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs align-top space-y-1 max-w-xs">
                            <div className="text-slate-700">
                              <strong className="text-slate-900">แก้ไข:</strong> {err.correctiveAction}
                            </div>
                            {err.preventiveAction && (
                              <div className="text-teal-800">
                                <strong>ป้องกัน:</strong> {err.preventiveAction}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center align-top whitespace-nowrap">
                            <select
                              value={err.status}
                              onChange={(e) =>
                                onUpdateErrorStatus(
                                  err.id,
                                  e.target.value as ErrorIncidentStatus
                                )
                              }
                              className="text-xs font-semibold rounded-lg border border-slate-200 bg-white py-1 px-2 cursor-pointer"
                            >
                              <option value="reported">รอทบทวน</option>
                              <option value="reviewed">ทบทวนแล้ว</option>
                              <option value="resolved">แก้ไขแล้ว</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Audit Trail */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="ค้นหาชื่อยา, ชื่อผู้ป่วย, HN หรือผู้ทำรายการ..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
            </div>

            <select
              value={auditTypeFilter}
              onChange={(e) =>
                setAuditTypeFilter(e.target.value as 'all' | StockChangeType)
              }
              className="py-2 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700"
            >
              <option value="all">ทุกประเภทการเคลื่อนไหว</option>
              <option value="admin_deduct">ตัดจ่ายใช้กับผู้ป่วยใน OR</option>
              <option value="restock">รับยาเข้าคลัง</option>
              <option value="return">ส่งคืนขวดเปล่า / รับคืนยา</option>
              <option value="correction">ปรับยอดตรวจนับสต็อก</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">วันที่ / เวลา</th>
                  <th className="py-3 px-4">รายการยา</th>
                  <th className="py-3 px-3 whitespace-nowrap">ประเภทรายการ</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">จำนวนเปลี่ยนแปลง</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">ยอดก่อน → หลัง</th>
                  <th className="py-3 px-4">ผู้ป่วย / หมายเหตุอ้างอิง</th>
                  <th className="py-3 px-4 whitespace-nowrap">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-500">
                      ไม่พบประวัติการเคลื่อนไหวสต็อกยา
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isPositive = log.quantityChange > 0;
                    const dtStr = new Date(log.timestamp).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                          {dtStr}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {log.drugName}
                        </td>
                        <td className="py-3 px-3 text-xs whitespace-nowrap">
                          {log.changeType === 'admin_deduct' && (
                            <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              ตัดจ่ายผู้ป่วยใน OR
                            </span>
                          )}
                          {log.changeType === 'restock' && (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              รับยาเข้าคลัง
                            </span>
                          )}
                          {log.changeType === 'return' && (
                            <span className="inline-flex items-center gap-1 font-medium text-sky-700">
                              <RefreshCw className="w-3.5 h-3.5" />
                              ส่งคืนขวดเปล่า
                            </span>
                          )}
                          {log.changeType === 'correction' && (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                              <RefreshCw className="w-3.5 h-3.5" />
                              ปรับยอดตรวจนับ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums font-bold">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-xs text-slate-500">
                          {log.previousStock} →{' '}
                          <strong className="text-slate-900">{log.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                          {log.reason}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                          {log.performedBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
