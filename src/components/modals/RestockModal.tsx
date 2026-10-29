import React, { useEffect, useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import { DrugItem, StockChangeType } from '../../types';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  drug: DrugItem | null;
  onAdjustStock: (
    drugId: string,
    changeType: StockChangeType,
    amountOrTarget: number,
    reason: string
  ) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  drug,
  onAdjustStock,
}) => {
  const [mode, setMode] = useState<'restock' | 'return' | 'correction'>('restock');
  const [amount, setAmount] = useState('10');
  const [reason, setReason] = useState('เบิกยาเติมคลังประจำวันจากห้องยาห้องผ่าตัด');

  useEffect(() => {
    if (!isOpen || !drug) return;
    setMode('restock');
    setAmount('10');
    setReason('เบิกยาเติมคลังประจำวันจากห้องยาห้องผ่าตัด');
  }, [isOpen, drug]);

  if (!isOpen || !drug) return null;

  const numVal = parseInt(amount, 10) || 0;
  const previewStock =
    mode === 'correction' ? Math.max(0, numVal) : Math.max(0, drug.stockCount + numVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'correction' && numVal <= 0) return;
    onAdjustStock(drug.id, mode, numVal, reason);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              รับยาเข้าสต็อก / ปรับปรุงยอดคงคลัง
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm text-slate-800">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">รายการยา</div>
            <div className="font-semibold text-slate-900 mt-0.5">{drug.name}</div>
            <div className="text-xs font-mono tabular-nums text-slate-600 mt-1">
              คงเหลือปัจจุบัน: <strong>{drug.stockCount}</strong> → ยอดใหม่หลังบันทึก:{' '}
              <strong className="text-teal-800">{previewStock}</strong>
            </div>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg w-full">
            {(
              [
                { id: 'restock', label: 'รับยาเข้าคลัง' },
                { id: 'return', label: 'รับคืนยา' },
                { id: 'correction', label: 'ปรับยอดตรวจนับ' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setMode(opt.id);
                  if (opt.id === 'correction') setAmount(String(drug.stockCount));
                  else setAmount('10');
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  mode === opt.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {mode === 'correction'
                ? 'ระบุยอดคงเหลือที่นับได้จริง *'
                : 'จำนวนหลอด/ขวดที่ต้องการรับเพิ่ม *'}
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หมายเหตุ / แหล่งอ้างอิงใบเบิก
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs"
            />
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
              className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold cursor-pointer"
            >
              ยืนยันปรับสต็อก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
