import React, { useEffect, useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { DrugCategory, DrugItem, DrugUnit } from '../../types';
import { CATEGORY_META } from '../../data/catalog';

interface DrugFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugToEdit: DrugItem | null;
  initialCategory: DrugCategory;
  onSaveDrug: (payload: Omit<DrugItem, 'id'> & { id?: string }) => void;
}

export const DrugFormModal: React.FC<DrugFormModalProps> = ({
  isOpen,
  onClose,
  drugToEdit,
  initialCategory,
  onSaveDrug,
}) => {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState<DrugCategory>(initialCategory);
  const [unit, setUnit] = useState<DrugUnit>('mg');
  const [concentration, setConcentration] = useState('');
  const [standardVialDose, setStandardVialDose] = useState('50');
  const [stockCount, setStockCount] = useState('20');
  const [minAlertStock, setMinAlertStock] = useState('5');
  const [lotNumber, setLotNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isHad, setIsHad] = useState(false);
  const [isMultiDoseVial, setIsMultiDoseVial] = useState(false);
  const [vialCapacity, setVialCapacity] = useState('10');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (drugToEdit) {
      setName(drugToEdit.name);
      setGenericName(drugToEdit.genericName);
      setCategory(drugToEdit.category);
      setUnit(drugToEdit.unit);
      setConcentration(drugToEdit.concentration);
      setStandardVialDose(String(drugToEdit.standardVialDose));
      setStockCount(String(drugToEdit.stockCount));
      setMinAlertStock(String(drugToEdit.minAlertStock));
      setLotNumber(drugToEdit.lotNumber || '');
      setExpiryDate(drugToEdit.expiryDate || '');
      setIsHad(drugToEdit.isHad);
      setIsMultiDoseVial(Boolean(drugToEdit.isMultiDoseVial));
      setVialCapacity(String(drugToEdit.vialCapacity || 10));
      setNotes(drugToEdit.notes || '');
    } else {
      setName('');
      setGenericName('');
      setCategory(initialCategory);
      setUnit(initialCategory === 'opioid' ? 'mcg' : initialCategory === 'inhalation' ? 'ml' : 'mg');
      setConcentration('');
      setStandardVialDose(initialCategory === 'opioid' ? '100' : '50');
      setStockCount('20');
      setMinAlertStock('6');
      setLotNumber('');
      setExpiryDate('');
      setIsHad(initialCategory === 'had');
      setIsMultiDoseVial(false);
      setVialCapacity('10');
      setNotes('');
    }
  }, [isOpen, drugToEdit, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const doseNum = parseFloat(standardVialDose) || 1;
    const stockNum = Math.max(0, parseInt(stockCount, 10) || 0);
    const minNum = Math.max(0, parseInt(minAlertStock, 10) || 5);

    onSaveDrug({
      id: drugToEdit?.id,
      name: name.trim(),
      genericName: genericName.trim() || name.trim(),
      category,
      unit,
      concentration: concentration.trim() || `${doseNum} ${unit}`,
      standardVialDose: doseNum,
      stockCount: stockNum,
      minAlertStock: minNum,
      lotNumber: lotNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
      isHighAlert: isHad,
      isHad,
      isMultiDoseVial,
      vialCapacity: isMultiDoseVial ? parseFloat(vialCapacity) || 10 : undefined,
      activeVialUsed: drugToEdit?.activeVialUsed ?? 0,
      activeVialRemaining:
        drugToEdit?.activeVialRemaining ??
        (isMultiDoseVial ? parseFloat(vialCapacity) || 10 : undefined),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-slate-900">
              {drugToEdit ? 'แก้ไขข้อมูลยาในสต็อกวิสัญญี' : 'เพิ่มรายการยาใหม่เข้าคลัง'}
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

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หมวดหมู่ยา *
            </label>
            <select
              value={category}
              onChange={(e) => {
                const c = e.target.value as DrugCategory;
                setCategory(c);
                if (c === 'had') setIsHad(true);
              }}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
            >
              {(Object.keys(CATEGORY_META) as DrugCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].th}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อยาการค้า / แสดงผล *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="เช่น Fentanyl Citrate 100 mcg/2ml"
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อสามัญทางยา (Generic)
              </label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="เช่น Fentanyl Citrate"
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                หน่วยยาหลัก *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as DrugUnit)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono"
              >
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
                <option value="ml">ml</option>
                <option value="units">units</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ขนาดบรรจุต่อหลอด *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={standardVialDose}
                onChange={(e) => setStandardVialDose(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ความเข้มข้น
              </label>
              <input
                type="text"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                placeholder="50 mcg/ml"
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                จำนวนสต็อกคงเหลือ
              </label>
              <input
                type="number"
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                จุดเตือนสั่งเบิก (Min Stock)
              </label>
              <input
                type="number"
                min="0"
                value={minAlertStock}
                onChange={(e) => setMinAlertStock(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lot Number
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="FT-2026A"
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันหมดอายุ
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isHad}
                onChange={(e) => setIsHad(e.target.checked)}
                className="rounded text-red-600"
              />
              <span>เป็นยาความเสี่ยงสูง (HAD - High Alert Drug)</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isMultiDoseVial}
                onChange={(e) => setIsMultiDoseVial(e.target.checked)}
                className="rounded text-teal-700"
              />
              <span>ขวดเปิดใช้สะสมหลายเคส (Multi-Dose Vial)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              คำแนะนำทางคลินิก / ข้อควรระวัง
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              บันทึกข้อมูลยา
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
