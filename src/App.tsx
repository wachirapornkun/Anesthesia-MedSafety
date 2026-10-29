import { useState } from 'react';
import { AppTab, DrugCategory, DrugItem } from './types';
import { getLocalDateString } from './data/catalog';
import { useMedSafeStore } from './store/useMedSafeStore';
import { Header } from './components/Header';
import { SafetyProtocolBanner } from './components/SafetyProtocolBanner';
import { DailyLogView } from './components/DailyLogView';
import { InventoryView } from './components/InventoryView';
import { MonthlySummaryView } from './components/MonthlySummaryView';
import { AnalyticsView } from './components/AnalyticsView';
import { SafetyAndAuditView } from './components/SafetyAndAuditView';
import { AggregatedDailyPatient } from './components/DailyPatientRosterPanel';
import { RecordAdministrationModal } from './components/modals/RecordAdministrationModal';
import { PatientFormModal } from './components/modals/PatientFormModal';
import { DrugFormModal } from './components/modals/DrugFormModal';
import { RestockModal } from './components/modals/RestockModal';
import {
  MedErrorModal,
  StaffModal,
} from './components/modals/StaffAndErrorModals';

export default function App() {
  const {
    initialized,
    drugs,
    dailyPatients,
    administrations,
    staffList,
    medicationErrors,
    auditLogs,
    activeOperatorName,
    setActiveOperatorName,
    saveDailyPatient,
    updatePatientStatus,
    deleteDailyPatient,
    recordAdministration,
    resetMultiDoseVial,
    saveDrug,
    adjustDrugStock,
    addStaffMember,
    toggleStaffActive,
    deleteStaffMember,
    addMedicationError,
    updateMedicationErrorStatus,
  } = useMedSafeStore();

  const [activeTab, setActiveTab] = useState<AppTab>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [inventoryLowStockJump, setInventoryLowStockJump] = useState(false);

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [preselectedDrugId, setPreselectedDrugId] = useState<string | null>(null);
  const [preselectedPatient, setPreselectedPatient] =
    useState<AggregatedDailyPatient | null>(null);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientModalDate, setPatientModalDate] = useState<string>(() =>
    getLocalDateString()
  );
  const [patientToEdit, setPatientToEdit] =
    useState<AggregatedDailyPatient | null>(null);

  const [isDrugModalOpen, setIsDrugModalOpen] = useState(false);
  const [drugToEdit, setDrugToEdit] = useState<DrugItem | null>(null);
  const [initialDrugCategory, setInitialDrugCategory] =
    useState<DrugCategory>('opioid');

  const [restockTargetDrug, setRestockTargetDrug] = useState<DrugItem | null>(
    null
  );
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isMedErrorModalOpen, setIsMedErrorModalOpen] = useState(false);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-3">
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-24 w-full bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const lowStockCount = drugs.filter(
    (d) => d.stockCount <= d.minAlertStock
  ).length;
  const unresolvedErrorCount = medicationErrors.filter(
    (e) => e.status !== 'resolved'
  ).length;

  const openBlankRecordModal = () => {
    setPreselectedDrugId(null);
    setPreselectedPatient(null);
    setIsRecordModalOpen(true);
  };

  const openRecordModalForDrug = (drugId: string) => {
    setPreselectedDrugId(drugId);
    setPreselectedPatient(null);
    setIsRecordModalOpen(true);
  };

  const openRecordModalForPatient = (patient: AggregatedDailyPatient) => {
    setPreselectedPatient(patient);
    setPreselectedDrugId(null);
    setIsRecordModalOpen(true);
  };

  const openNewPatientModal = (dateStr: string) => {
    setPatientToEdit(null);
    setPatientModalDate(dateStr);
    setIsPatientModalOpen(true);
  };

  const openEditPatientModal = (patient: AggregatedDailyPatient) => {
    setPatientToEdit(patient);
    setPatientModalDate(selectedDate);
    setIsPatientModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setInventoryLowStockJump(false);
          setActiveTab(tab);
        }}
        onOpenRecordModal={openBlankRecordModal}
      />

      <SafetyProtocolBanner
        staffList={staffList}
        activeOperatorName={activeOperatorName}
        onChangeOperator={setActiveOperatorName}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenMedErrorModal={() => setIsMedErrorModalOpen(true)}
        lowStockCount={lowStockCount}
        unresolvedErrorCount={unresolvedErrorCount}
        onGoToInventoryLowStock={() => {
          setInventoryLowStockJump(true);
          setActiveTab('inventory');
        }}
        onGoToSafety={() => setActiveTab('safety')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'daily' && (
          <DailyLogView
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            dailyPatients={dailyPatients}
            administrations={administrations}
            onOpenRecordModal={openBlankRecordModal}
            onAddDrugForPatient={openRecordModalForPatient}
            onOpenNewPatientModal={openNewPatientModal}
            onEditPatientModal={openEditPatientModal}
            onUpdatePatientStatus={updatePatientStatus}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            key={inventoryLowStockJump ? 'inv-low' : 'inv-all'}
            drugs={drugs}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            dailyPatients={dailyPatients}
            administrations={administrations}
            initialLowStockOnly={inventoryLowStockJump}
            onRecordDrug={openRecordModalForDrug}
            onAddDrugForPatient={openRecordModalForPatient}
            onOpenNewPatientModal={openNewPatientModal}
            onEditPatientModal={openEditPatientModal}
            onNavigateFullDailyView={() => setActiveTab('daily')}
            onRestockDrug={(drug) => setRestockTargetDrug(drug)}
            onEditDrug={(drug) => {
              setDrugToEdit(drug);
              setIsDrugModalOpen(true);
            }}
            onOpenAddDrug={(cat) => {
              setDrugToEdit(null);
              setInitialDrugCategory(cat);
              setIsDrugModalOpen(true);
            }}
            onResetMultiDoseVial={resetMultiDoseVial}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlySummaryView administrations={administrations} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView administrations={administrations} />
        )}

        {activeTab === 'safety' && (
          <SafetyAndAuditView
            errors={medicationErrors}
            auditLogs={auditLogs}
            onOpenReportModal={() => setIsMedErrorModalOpen(true)}
            onUpdateErrorStatus={updateMedicationErrorStatus}
          />
        )}
      </main>

      <footer className="mt-auto py-5 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Anesthesia MedSafe — ระบบจัดการคลังยาและทะเบียนรายชื่อผู้ป่วยที่ใช้ยาทางวิสัญญีวิทยา
          </span>
          <span>มาตรฐานความปลอดภัยทางยา 6 Rights & NCC MERP</span>
        </div>
      </footer>

      {/* Modals */}
      <RecordAdministrationModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        drugs={drugs}
        staffList={staffList}
        dailyPatients={dailyPatients}
        administrations={administrations}
        selectedDate={selectedDate}
        preselectedDrugId={preselectedDrugId}
        preselectedPatient={preselectedPatient}
        activeOperatorName={activeOperatorName}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onSubmitAdministration={(payload, linkedError) => {
          setSelectedDate(payload.dateString);
          recordAdministration(payload, linkedError);
        }}
      />

      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        defaultDate={patientModalDate}
        patientToEdit={patientToEdit}
        staffList={staffList}
        activeOperatorName={activeOperatorName}
        onSavePatient={(payload) => {
          setSelectedDate(payload.dateString);
          saveDailyPatient(payload);
        }}
        onDeletePatient={deleteDailyPatient}
      />

      <DrugFormModal
        isOpen={isDrugModalOpen}
        onClose={() => setIsDrugModalOpen(false)}
        drugToEdit={drugToEdit}
        initialCategory={initialDrugCategory}
        onSaveDrug={saveDrug}
      />

      <RestockModal
        isOpen={Boolean(restockTargetDrug)}
        onClose={() => setRestockTargetDrug(null)}
        drug={restockTargetDrug}
        onAdjustStock={adjustDrugStock}
      />

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffList={staffList}
        onAddStaff={addStaffMember}
        onToggleStaffActive={toggleStaffActive}
        onDeleteStaff={deleteStaffMember}
      />

      <MedErrorModal
        isOpen={isMedErrorModalOpen}
        onClose={() => setIsMedErrorModalOpen(false)}
        drugs={drugs}
        dailyPatients={dailyPatients}
        activeOperatorName={activeOperatorName}
        onSubmitError={addMedicationError}
      />
    </div>
  );
}
