import React from 'react';
import { Plus } from 'lucide-react';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenRecordModal: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'daily', label: 'ผู้ป่วยประจำวัน' },
  { id: 'inventory', label: 'คลังสต็อกยา' },
  { id: 'monthly', label: 'สรุปรายเดือน' },
  { id: 'analytics', label: 'วิเคราะห์ข้อมูล' },
  { id: 'safety', label: 'ความปลอดภัย' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenRecordModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#daily"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('daily');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Anesthesia MedSafe
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab(item.id);
                }}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  isActive
                    ? 'text-teal-800 font-semibold border-teal-700'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenRecordModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>บันทึกการใช้ยา</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip (hidden on desktop) */}
      <nav
        aria-label="เมนูมือถือ"
        className="flex md:hidden items-center gap-4 overflow-x-auto px-4 py-2 border-t border-slate-100 text-xs font-medium text-slate-600"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? 'text-teal-800 font-semibold border-teal-700'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
