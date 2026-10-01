import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';

// Modais Paperless, Financeiro & Operacional
import { ConsentModal, ProcedureConsentItem } from './components/paperless/ConsentModal';
import { ReceptionAnamnesisModal, AnamnesisAnswers } from './components/paperless/ReceptionAnamnesisModal';
import { CheckoutModal, CheckoutResult } from './components/financial/CheckoutModal';
import { ReceiptModal } from './components/financial/ReceiptModal';
import { AppointmentModal, AppointmentItem, timeToMinutes } from './components/schedule/AppointmentModal';
import { InventoryModal, InventoryItem } from './components/inventory/InventoryModal';
import { LabOrderModal, LabOrder, LabOrderStatus } from './components/prosthetics/LabOrderModal';
import { PrescriptionModal } from './components/prescription/PrescriptionModal';
import { PatientModal } from './components/patients/PatientModal';
import { DentistPinModal } from './components/auth/DentistPinModal';
import { ReceptionistSwitchModal } from './components/auth/ReceptionistSwitchModal';
import { ActivePatientSwitchModal } from './components/patients/ActivePatientSwitchModal';
import { ClinicalDocumentModal } from './components/documents/ClinicalDocumentModal';
import { LoginView } from './components/auth/LoginView';

// Layout & UI
import { AppHeader } from './components/layout/AppHeader';
import { AppNavBar, ActiveTab } from './components/layout/AppNavBar';
import { MobileBottomDock } from './components/layout/MobileBottomDock';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Toast } from './components/ui/Toast';
import { ProntuarioSubTab } from './components/prontuario/ProntuarioView';

// Types & Utils
import { Patient, PatientTreatmentItem } from './types/patient';
import { ClinicSettings, DEFAULT_CLINIC_SETTINGS, DEFAULT_PROCEDURES, ReceptionistProfile } from './types/settings';
import { ClinicSession, UserRole } from './types/auth';
import { openWhatsAppDirect, buildAppointmentConfirmationMessage } from './utils/whatsapp';
import { buildActivePatientFromRecord, ActivePatientInfo } from './utils/patientUtils';
import {
  loadFromStorage,
  getPatients,
  savePatient,
  deletePatient,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  saveToStorage,
  getActiveRole,
  saveActiveRole,
  syncPatientsWithServer
} from './services/storage';
import { api } from './services/api';

// Seeds & Custom Hooks
import { DEFAULT_APPOINTMENTS } from './data/seedAppointments';
import { DEFAULT_TRANSACTIONS } from './data/seedTransactions';
import { DEFAULT_LAB_ORDERS } from './data/seedLabOrders';
import { DEFAULT_INVENTORY } from './data/seedInventory';
import { DEFAULT_EVOLUTIONS, ClinicalEvolution } from './data/seedEvolutions';
import { useModals } from './hooks/useModals';
import { useAppSync } from './hooks/useAppSync';
import { useToast } from './hooks/useToast';

// Code Splitting (React.lazy) para otimização de bundle e carregamento veloz
const DashboardView = lazy(() => import('./components/dashboard/DashboardView'));
const PatientsView = lazy(() => import('./components/patients/PatientsView').then((m) => ({ default: m.PatientsView })));
const ProntuarioView = lazy(() => import('./components/prontuario/ProntuarioView').then((m) => ({ default: m.ProntuarioView })));
const ScheduleView = lazy(() => import('./components/schedule/ScheduleView').then((m) => ({ default: m.ScheduleView })));
const CashbookView = lazy(() => import('./components/financial/CashbookView').then((m) => ({ default: m.CashbookView })));
const AutoclaveLog = lazy(() => import('./components/biosecurity/AutoclaveLog').then((m) => ({ default: m.AutoclaveLog })));
const LabView = lazy(() => import('./components/prosthetics/LabView').then((m) => ({ default: m.LabView })));
const InventoryView = lazy(() => import('./components/inventory/InventoryView').then((m) => ({ default: m.InventoryView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView })));

export type { UserRole };

const EMPTY_ACTIVE_PATIENT: ActivePatientInfo = {
  id: '',
  name: 'Nenhum Paciente Selecionado',
  cpf: '---',
  phone: '---',
  birthDate: '---',
  medicalAlerts: {
    hypertension: false,
    diabetes: false,
    anticoagulant: false,
    allergies: []
  }
};

export function App() {
  // Sessão de Autenticação Multi-Clínica SaaS
  const [session, setSession] = useState<ClinicSession | null>(() => getActiveSession());

  // Papel ativo: Dentista Autônomo vs Recepcionista (Persistente e protegido contra F5)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() =>
    getActiveRole(getActiveSession()?.clinicId)
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const initialRole = getActiveRole(getActiveSession()?.clinicId);
    return initialRole === 'RECEPTIONIST' ? 'SCHEDULE' : 'DASHBOARD';
  });

  // Notificações Toast Modernas
  const { toast, showToast, hideToast } = useToast();

  // Controle Centralizado de Modais
  const modals = useModals();

  // Sub-abas do Prontuário & Histórico Clínico
  const [prontuarioSubTab, setProntuarioSubTab] = useState<ProntuarioSubTab>('ODONTOGRAM');
  const [clinicalEvolutions, setClinicalEvolutions] = useState<ClinicalEvolution[]>(() =>
    loadFromStorage('CLINICAL_EVOLUTIONS', DEFAULT_EVOLUTIONS, session?.clinicId)
  );

  // Lista de Pacientes
  const [patientsList, setPatientsList] = useState<Patient[]>(() => getPatients(session?.clinicId));

  // Paciente ativo no consultório
  const [activePatient, setActivePatient] = useState<ActivePatientInfo>(() => {
    const initialList = getPatients(session?.clinicId);
    if (initialList.length > 0) {
      return buildActivePatientFromRecord(initialList[0]);
    }
    return EMPTY_ACTIVE_PATIENT;
  });

  // Lote de instrumental esterilizado (ANVISA RDC 15)
  const [activeSterilizationLot, setActiveSterilizationLot] = useState(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `LOTE-${day}${month}-01`;
  });

  // Procedimentos planejados para o TCLE do paciente ativo
  const plannedProceduresForConsent: ProcedureConsentItem[] = [];

  // Dados das demais abas operacionais
  const [appointments, setAppointments] = useState<AppointmentItem[]>(() =>
    loadFromStorage('APPOINTMENTS', DEFAULT_APPOINTMENTS, session?.clinicId)
  );
  const [transactions, setTransactions] = useState<any[]>(() =>
    loadFromStorage('TRANSACTIONS', DEFAULT_TRANSACTIONS, session?.clinicId)
  );
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() =>
    loadFromStorage('LAB_ORDERS', DEFAULT_LAB_ORDERS, session?.clinicId)
  );
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadFromStorage('INVENTORY', DEFAULT_INVENTORY, session?.clinicId)
  );

  // Configurações Oficiais da Clínica
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => {
    const loaded = loadFromStorage('SETTINGS', DEFAULT_CLINIC_SETTINGS, session?.clinicId);
    const merged = {
      ...DEFAULT_CLINIC_SETTINGS,
      ...(session ? { clinicName: session.clinicName, dentistName: session.dentistName, dentistCro: session.dentistCro } : {}),
      ...loaded
    };
    if (
      (!merged.clinicName || merged.clinicName === 'Consultório Odontológico Dra. Juliana Mendes') &&
      merged.dentistName &&
      merged.dentistName !== 'Dra. Juliana Mendes'
    ) {
      merged.clinicName = `Consultório Odontológico ${merged.dentistName}`;
    }
    return merged;
  });

  // Sincronização em tempo real & Auto-Save desacoplado
  useAppSync({
    session,
    clinicSettings,
    setClinicSettings,
    patientsList,
    setPatientsList,
    appointments,
    setAppointments,
    transactions,
    setTransactions,
    labOrders,
    setLabOrders,
    inventory,
    setInventory,
    clinicalEvolutions,
    setClinicalEvolutions,
    setCurrentUserRole,
    setActiveTab,
    onPatientLoaded: (loaded) => {
      if (loaded.length > 0 && !activePatient.id) {
        setActivePatient(buildActivePatientFromRecord(loaded[0]));
      }
    }
  });

  // Proteção RBAC: Bloqueio imediato de abas sigilosas se for RECEPÇÃO
  useEffect(() => {
    if (currentUserRole === 'RECEPTIONIST' && (activeTab === 'SETTINGS' || activeTab === 'ODONTOGRAM')) {
      setActiveTab('SCHEDULE');
    }
  }, [currentUserRole, activeTab]);

  // Handlers de Autenticação e Perfil
  const handleLogout = () => {
    if (window.confirm(`Deseja realmente encerrar a sessão de "${session?.clinicName || 'clínica'}"?`)) {
      clearActiveSession();
      setSession(null);
      setCurrentUserRole('RECEPTIONIST');
      setActiveTab('SCHEDULE');
      showToast('Sessão encerrada com sucesso', 'info');
    }
  };

  const handleSelectDentistRole = () => {
    if (currentUserRole === 'RECEPTIONIST') {
      modals.setIsPinModalOpen(true);
    } else {
      setCurrentUserRole('DENTIST');
      saveActiveRole('DENTIST', session?.clinicId);
    }
  };

  const handlePinSuccess = () => {
    modals.setIsPinModalOpen(false);
    setCurrentUserRole('DENTIST');
    saveActiveRole('DENTIST', session?.clinicId);
    showToast('Acesso de Cirurgião-Dentista autorizado', 'success');

    if (session?.clinicId) {
      syncPatientsWithServer(session.clinicId).then((serverPatients) => {
        if (serverPatients && serverPatients.length > 0) {
          setPatientsList(serverPatients);
        }
      });
    }
  };

  const handleSwitchToReceptionist = () => {
    setCurrentUserRole('RECEPTIONIST');
    saveActiveRole('RECEPTIONIST', session?.clinicId);
    if (activeTab === 'SETTINGS' || activeTab === 'ODONTOGRAM') {
      setActiveTab('SCHEDULE');
    }
    showToast('Modo Recepção ativado (Dados clínicos protegidos)', 'info');

    if (session?.clinicId) {
      syncPatientsWithServer(session.clinicId).then((serverPatients) => {
        if (serverPatients && serverPatients.length > 0) {
          setPatientsList(serverPatients);
        }
      });
    }
  };

  // Handlers Clínicos e Prontuário
  const handleAddEvolution = (procedure: string, tooth: string, text: string) => {
    if (!text.trim()) return;

    const newEntry: ClinicalEvolution = {
      id: `evo_${crypto.randomUUID()}`,
      patientId: activePatient.id,
      patientName: activePatient.name,
      date: `${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      dentistName: clinicSettings.dentistName,
      dentistCro: clinicSettings.dentistCro,
      procedure: procedure || 'Procedimento Clínico',
      tooth: tooth || 'Geral',
      text: text.trim(),
      sterilizationLot: activeSterilizationLot
    };

    setClinicalEvolutions([newEntry, ...clinicalEvolutions]);
    showToast('Evolução clínica registrada com sucesso', 'success');

    if (activePatient.id) {
      api.clinical.addEvolution({
        patientId: activePatient.id,
        patientName: activePatient.name,
        procedure: procedure || 'Procedimento Clínico',
        tooth: tooth || 'Geral',
        text: text.trim(),
        sterilizationLot: activeSterilizationLot
      }).catch((err) => console.warn('Evolução salva localmente:', err));
    }
  };

  // Handlers da Agenda
  const updateAppointmentStatus = (id: string, newStatus: AppointmentItem['status']) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );

    api.schedule.updateStatus(id, newStatus).catch(() => {});

    if (newStatus === 'COMPLETED') {
      const app = appointments.find((a) => a.id === id);
      if (app) {
        modals.setSelectedAppointmentForCheckout(app);
        modals.setIsCheckoutModalOpen(true);
      }
    }
  };

  const triggerWhatsApp = (id: string) => {
    const app = appointments.find((a) => a.id === id);
    if (!app) return;

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, whatsappStatus: 'SENT' } : a))
    );

    showToast(`Lembrete WhatsApp disparado para ${app.patientName}`, 'success');
  };

  const handleSaveAppointment = (saved: AppointmentItem) => {
    if (!patientsList.some((p) => p.name.toLowerCase() === saved.patientName.toLowerCase())) {
      const newPat: Patient = {
        id: `pat_${crypto.randomUUID()}`,
        name: saved.patientName,
        phone: saved.patientPhone,
        cpf: '',
        birthDate: '1995-01-01',
        gender: 'OTHER',
        status: 'IN_TREATMENT',
        medicalAlerts: {
          hypertension: false,
          diabetes: false,
          anticoagulant: false,
          allergicPenicillin: false,
          allergicAnesthetics: false,
          allergicDipyroneNSAIDs: false,
          pregnantOrLactating: false,
          allergies: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      savePatient(newPat);
      setPatientsList(getPatients(session?.clinicId));
    }

    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      let list: AppointmentItem[];
      if (exists) {
        list = prev.map((a) => (a.id === saved.id ? saved : a));
      } else {
        list = [...prev, saved];
      }
      return list.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    });

    api.schedule.save(saved).catch((err) => console.warn('Agendamento salvo localmente:', err));
    showToast('Agendamento salvo com sucesso', 'success');
  };

  const handleDeleteAppointment = (id: string) => {
    const app = appointments.find((a) => a.id === id);
    if (!app) return;
    if (window.confirm(`Deseja excluir o agendamento de "${app.patientName}" (${app.time})?`)) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      api.schedule.delete(id).catch((err) => console.warn('Exclusão no backend falhou:', err));
      showToast('Agendamento removido', 'info');
    }
  };

  // Handlers de Pacientes
  const handleSavePatient = (saved: Patient) => {
    savePatient(saved);
    setPatientsList(getPatients(session?.clinicId));
    if (activePatient.id === saved.id || activePatient.name === saved.name) {
      setActivePatient(buildActivePatientFromRecord(saved));
    }
    showToast('Paciente salvo com sucesso', 'success');
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatient(patientId);
    setPatientsList(getPatients(session?.clinicId));
    showToast('Paciente excluído', 'info');
  };

  const handleOpenOdontogramForPatient = (patient: Patient) => {
    setActivePatient(buildActivePatientFromRecord(patient));
    setActiveTab('ODONTOGRAM');
  };

  const handleSwitchActivePatient = (patient: Patient, appointmentId?: string) => {
    handleOpenOdontogramForPatient(patient);
    if (appointmentId) {
      updateAppointmentStatus(appointmentId, 'IN_PROGRESS');
    }
    showToast(`Paciente ativo: ${patient.name}`, 'info');
  };

  // Handlers de Estoque e Protéticos
  const handleSaveInventoryItem = (saved: InventoryItem) => {
    setInventory((prev) => {
      const exists = prev.some((i) => i.id === saved.id);
      return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...prev];
    });
    api.aux.saveInventory(saved).catch((err) => console.warn('Estoque salvo localmente:', err));
    showToast('Item de estoque salvo', 'success');
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
    );
  };

  const handleDeleteInventoryItem = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    if (window.confirm(`Deseja excluir "${item.name}" do estoque?`)) {
      setInventory((prev) => prev.filter((i) => i.id !== id));
      api.aux.deleteInventory(id).catch(() => {});
      showToast('Item excluído do estoque', 'info');
    }
  };

  const handleSaveLabOrder = (saved: LabOrder) => {
    setLabOrders((prev) => {
      const exists = prev.some((o) => o.id === saved.id);
      return exists ? prev.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...prev];
    });
    api.aux.saveLabOrder(saved).catch((err) => console.warn('O.S. salva localmente:', err));
    showToast('Ordem de Serviço salva', 'success');
  };

  const handleUpdateLabOrderStatus = (id: string, newStatus: LabOrderStatus) => {
    setLabOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteLabOrder = (id: string) => {
    const order = labOrders.find((o) => o.id === id);
    if (!order) return;
    if (window.confirm(`Deseja cancelar a O.S. de "${order.patientName}"?`)) {
      setLabOrders((prev) => prev.filter((o) => o.id !== id));
      api.aux.deleteLabOrder(id).catch(() => {});
      showToast('Ordem de serviço cancelada', 'info');
    }
  };

  // Anamnese Kiosk
  const handleSaveAnamnesis = (answers: AnamnesisAnswers) => {
    const updatedAllergies: string[] = [];
    if (answers.allergyPenicillin) updatedAllergies.push('Penicilina / Amoxicilina');
    if (answers.allergyDipirona) updatedAllergies.push('Dipirona / Anti-inflamatórios');
    if (answers.allergyAnesthetic) updatedAllergies.push('Anestésicos Dentários');

    setActivePatient((prev) => ({
      ...prev,
      medicalAlerts: {
        hypertension: answers.hypertension,
        diabetes: answers.diabetes,
        anticoagulant: answers.anticoagulant,
        allergies: updatedAllergies
      }
    }));

    const matched = patientsList.find(
      (p) => p.id === activePatient.id || p.name.toLowerCase() === activePatient.name.toLowerCase()
    );
    if (matched) {
      const updatedPatient: Patient = {
        ...matched,
        medicalAlerts: {
          ...matched.medicalAlerts,
          hypertension: answers.hypertension,
          diabetes: answers.diabetes,
          anticoagulant: answers.anticoagulant,
          allergies: updatedAllergies
        },
        updatedAt: new Date().toISOString()
      };
      savePatient(updatedPatient);
      setPatientsList(getPatients(session?.clinicId));
      showToast('Anamnese registrada e sincronizada com sucesso', 'success');
    }

    if (activePatient.id) {
      api.patients.saveAnamnesis(activePatient.id, {
        hasHypertension: answers.hypertension,
        hasDiabetes: answers.diabetes,
        isAnticoagulated: answers.anticoagulant,
        allergies: updatedAllergies,
        medicalAlerts: answers.observations,
        signatureDataUrl: answers.signature?.signatureBase64,
        hashSha256: answers.hashSha256
      }).catch((err) => {
        console.error('Falha ao persistir anamnese na API:', err);
      });
    }
  };

  // Sincronização do plano de tratamento / orçamento
  const handleSyncTreatmentPlan = (items: PatientTreatmentItem[], total: number) => {
    const matched = patientsList.find(
      (p) => p.id === activePatient.id || p.name.toLowerCase() === activePatient.name.toLowerCase()
    );

    if (matched) {
      const updated: Patient = {
        ...matched,
        treatmentItems: items,
        pendingBudgetAmount: total
      };
      savePatient(updated);
      setPatientsList(getPatients(session?.clinicId));
    }

    const procedureSummary = items.length > 0
      ? items.map((i) => {
          const label = i.procedureName || i.name || 'Procedimento';
          return i.toothNumber ? `${label} (D.${i.toothNumber})` : label;
        }).join(', ')
      : 'Consulta Odontológica / Procedimento';

    setAppointments((prev) =>
      prev.map((app) => {
        if (
          app.patientName.toLowerCase() === activePatient.name.toLowerCase() &&
          ['IN_PROGRESS', 'WAITING_ROOM', 'SCHEDULED', 'CONFIRMED'].includes(app.status)
        ) {
          return { ...app, procedure: procedureSummary };
        }
        return app;
      })
    );
  };

  // Checkout no Balcão
  const handlePaymentCompleted = (result: CheckoutResult) => {
    modals.setCheckoutData(result);
    modals.setIsCheckoutModalOpen(false);
    modals.setSelectedAppointmentForCheckout(null);

    const now = new Date();
    const newTx = {
      id: `tx_${crypto.randomUUID()}`,
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'INCOME' as const,
      category: 'Tratamento',
      desc: `${result.description} - ${result.patientName}`,
      amount: result.grossTotal,
      method: result.payments.map((p) => p.method).join(' + '),
      dmed: true,
      patientName: result.patientName,
      patientCpf: result.patientCpf,
      payerCpf: result.payerCpf,
      payments: result.payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        feePercentage: p.feePercentage
      }))
    };

    setTransactions([newTx, ...transactions]);
    api.financial.createTransaction(newTx).catch((err) => console.warn('Transação salva localmente:', err));

    setAppointments((prev) =>
      prev.map((a) => (a.patientName === result.patientName ? { ...a, paid: true } : a))
    );

    const matched = patientsList.find(
      (p) => p.name.toLowerCase() === result.patientName.toLowerCase()
    );
    if (matched) {
      const updated: Patient = {
        ...matched,
        pendingBudgetAmount: 0,
        treatmentItems: []
      };
      savePatient(updated);
      setPatientsList(getPatients(session?.clinicId));
    }

    modals.setIsReceiptModalOpen(true);
    showToast('Pagamento confirmado e recibo emitido!', 'success');
  };

  // Bloqueio de acesso se não houver login
  if (!session) {
    return <LoginView onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  const counts = {
    patients: patientsList.length,
    appointments: appointments.length,
    labOrders: labOrders.length
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast de Notificação do Sistema */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      {/* 1. HEADER DO CONSULTÓRIO & SELETOR DE PERFIL */}
      <AppHeader
        clinicSettings={clinicSettings}
        currentUserRole={currentUserRole}
        activePatient={activePatient}
        onSelectDentistRole={handleSelectDentistRole}
        onSwitchToReceptionist={handleSwitchToReceptionist}
        onOpenActivePatientSwitch={() => modals.setIsActivePatientSwitchModalOpen(true)}
        onOpenReceptionistSwitch={() => modals.setIsReceptionistSwitchModalOpen(true)}
        onOpenMobileMenu={() => modals.setIsMobileMenuOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. BARRA DE NAVEGAÇÃO ENTRE MÓDULOS */}
      <AppNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUserRole={currentUserRole}
        counts={counts}
        onOpenMobileMenu={() => modals.setIsMobileMenuOpen(true)}
        onPinRequired={() => modals.setIsPinModalOpen(true)}
      />

      {/* 3. CONTEÚDO PRINCIPAL DINÂMICO COM CODE SPLITTING (SUSPENSE) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-28 md:pb-8">
        <Suspense fallback={<LoadingSpinner />}>
          {/* ABA: DASHBOARD DE MÉTRICAS */}
          {activeTab === 'DASHBOARD' && (
            <DashboardView
              patients={patientsList}
              appointments={appointments}
              transactions={transactions}
              inventory={inventory}
              dentistName={clinicSettings.dentistName}
              clinicName={clinicSettings.clinicName}
            />
          )}

          {/* ABA: PACIENTES */}
          {activeTab === 'PATIENTS' && (
            <PatientsView
              patients={patientsList}
              onNewPatient={modals.openNewPatientModal}
              onEditPatient={modals.openEditPatientModal}
              onDeletePatient={handleDeletePatient}
              onOpenOdontogram={handleOpenOdontogramForPatient}
              onScheduleAppointment={(p) => modals.openNewAppointmentModal(p.name)}
              onCheckout={(p) => {
                modals.setSelectedAppointmentForCheckout(null);
                setActivePatient(buildActivePatientFromRecord(p));
                modals.setIsCheckoutModalOpen(true);
              }}
              dentistName={clinicSettings.dentistName}
              clinicAddress={clinicSettings.clinicAddress}
            />
          )}

          {/* ABA: PRONTUÁRIO & ODONTOGRAMA */}
          {activeTab === 'ODONTOGRAM' && (
            <ProntuarioView
              activePatient={activePatient}
              currentUserRole={currentUserRole}
              activeSterilizationLot={activeSterilizationLot}
              onChangeLot={setActiveSterilizationLot}
              onSwitchPatient={() => modals.setIsActivePatientSwitchModalOpen(true)}
              clinicalEvolutions={clinicalEvolutions}
              clinicSettings={clinicSettings}
              procedurePricings={clinicSettings.procedurePricings || DEFAULT_PROCEDURES}
              onSyncTreatmentPlan={handleSyncTreatmentPlan}
              prontuarioSubTab={prontuarioSubTab}
              onChangeSubTab={setProntuarioSubTab}
              onOpenConsent={() => modals.setIsConsentModalOpen(true)}
              onOpenAnamnesis={() => modals.setIsAnamnesisModalOpen(true)}
              onOpenPrescription={() => modals.setIsPrescriptionModalOpen(true)}
              onOpenDocument={() => modals.setIsDocumentModalOpen(true)}
              onAddEvolution={handleAddEvolution}
              onSaveOdontogram={(data) => {
                showToast(`Odontograma salvo na versão ${data.versionNumber}!`, 'success');
                modals.setIsConsentModalOpen(true);
              }}
            />
          )}

          {/* ABA: AGENDA DO DIA */}
          {activeTab === 'SCHEDULE' && (
            <ScheduleView
              appointments={appointments}
              patientsList={patientsList}
              onNewAppointment={() => modals.openNewAppointmentModal()}
              onEditAppointment={modals.openEditAppointmentModal}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateStatus={updateAppointmentStatus}
              onTriggerWhatsApp={triggerWhatsApp}
              onOpenCheckout={(app) => {
                modals.setSelectedAppointmentForCheckout(app);
                modals.setIsCheckoutModalOpen(true);
              }}
              onOpenReceipt={(app) => {
                const matched = patientsList.find((p) => p.name === app.patientName);
                modals.setCheckoutData({
                  idempotencyKey: `rcpt_${crypto.randomUUID()}`,
                  patientName: app.patientName,
                  patientCpf: matched?.cpf || '342.981.458-20',
                  payerName: app.patientName,
                  payerCpf: matched?.cpf || '342.981.458-20',
                  grossTotal: 320.0,
                  netTotal: 320.0,
                  payments: [{ method: 'PIX', amount: 320.0, feePercentage: 0 }],
                  description: app.procedure,
                  timestamp: new Date().toISOString()
                });
                modals.setIsReceiptModalOpen(true);
              }}
              onCallToChair={(app) => {
                updateAppointmentStatus(app.id, 'IN_PROGRESS');
                const found = patientsList.find((p) => p.name.toLowerCase() === app.patientName.toLowerCase());
                if (found) {
                  handleOpenOdontogramForPatient(found);
                } else {
                  setActivePatient((prev) => ({
                    ...prev,
                    name: app.patientName,
                    phone: app.patientPhone
                  }));
                  setActiveTab('ODONTOGRAM');
                }
              }}
            />
          )}

          {/* ABA: FINANCEIRO & LIVRO CAIXA */}
          {activeTab === 'CASHBOOK' && (
            <CashbookView
              transactions={transactions}
              currentUserRole={currentUserRole}
              onAddTransaction={(tx) => setTransactions((prev) => [tx, ...prev])}
              onOpenNewCheckout={() => {
                modals.setSelectedAppointmentForCheckout(null);
                modals.setIsCheckoutModalOpen(true);
              }}
              dentistName={clinicSettings.dentistName}
              dentistCro={clinicSettings.dentistCro}
              receptionistName={clinicSettings.receptionistName || 'Mariana Costa'}
              clinicName={clinicSettings.clinicName}
              debitFee={clinicSettings.debitCardFee}
              creditFee={clinicSettings.creditCardFee}
              onOpenReceipt={(tx) => {
                modals.setCheckoutData({
                  idempotencyKey: tx.id,
                  patientName: tx.patientName || tx.desc.split(' - ')[1] || 'Paciente',
                  patientCpf: tx.patientCpf || '',
                  payerName: tx.patientName || tx.desc.split(' - ')[1] || 'Paciente',
                  payerCpf: tx.payerCpf || '',
                  grossTotal: tx.amount,
                  netTotal: tx.amount,
                  payments: tx.payments && tx.payments.length > 0
                    ? tx.payments.map((p: any) => {
                        const m = (p.method || '').toUpperCase();
                        let validMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' = 'CASH';
                        if (m.includes('PIX')) validMethod = 'PIX';
                        else if (m.includes('CRÉD') || m.includes('CRED')) validMethod = 'CREDIT_CARD';
                        else if (m.includes('DÉB') || m.includes('DEB')) validMethod = 'DEBIT_CARD';
                        return {
                          method: validMethod,
                          amount: p.amount,
                          feePercentage: p.feePercentage || 0
                        };
                      })
                    : [{
                        method: tx.method?.toUpperCase().includes('PIX')
                          ? 'PIX'
                          : tx.method?.toUpperCase().includes('CRÉD') || tx.method?.toUpperCase().includes('CRED')
                          ? 'CREDIT_CARD'
                          : tx.method?.toUpperCase().includes('DÉB') || tx.method?.toUpperCase().includes('DEB')
                          ? 'DEBIT_CARD'
                          : 'CASH',
                        amount: tx.amount,
                        feePercentage: 0
                      }],
                  description: tx.desc.split(' - ')[0] || tx.desc,
                  timestamp: `${tx.date} ${tx.time || ''}`
                });
                modals.setIsReceiptModalOpen(true);
              }}
            />
          )}

          {/* ABA: BIOSSEGURANÇA (RDC 15) */}
          {activeTab === 'BIOSECURITY' && <AutoclaveLog />}

          {/* ABA: PROTÉTICOS */}
          {activeTab === 'LAB' && (
            <LabView
              labOrders={labOrders}
              onNewLabOrder={modals.openNewLabOrderModal}
              onEditLabOrder={modals.openEditLabOrderModal}
              onDeleteLabOrder={handleDeleteLabOrder}
              onUpdateStatus={handleUpdateLabOrderStatus}
            />
          )}

          {/* ABA: ESTOQUE */}
          {activeTab === 'INVENTORY' && (
            <InventoryView
              inventory={inventory}
              onNewItem={modals.openNewInventoryModal}
              onEditItem={modals.openEditInventoryModal}
              onDeleteItem={handleDeleteInventoryItem}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {/* ABA: CONFIGURAÇÕES */}
          {activeTab === 'SETTINGS' && (
            <SettingsView
              settings={clinicSettings}
              onSaveSettings={(newSettings) => {
                const sanitized = { ...newSettings };
                if (
                  (!sanitized.clinicName || sanitized.clinicName === 'Consultório Odontológico Dra. Juliana Mendes') &&
                  sanitized.dentistName &&
                  sanitized.dentistName !== 'Dra. Juliana Mendes'
                ) {
                  sanitized.clinicName = `Consultório Odontológico ${sanitized.dentistName}`;
                }
                setClinicSettings(sanitized);
                saveToStorage('SETTINGS', sanitized, session?.clinicId);
                api.settings.update(sanitized).catch(() => {});

                if (session) {
                  const updatedSession = {
                    ...session,
                    clinicName: sanitized.clinicName,
                    dentistName: sanitized.dentistName,
                    dentistCro: sanitized.dentistCro
                  };
                  setSession(updatedSession);
                  saveActiveSession(updatedSession);
                }
                showToast('Configurações salvas e sincronizadas', 'success');
              }}
              onBackupRestored={(data) => {
                if (data.settings) setClinicSettings(data.settings);
                if (Array.isArray(data.appointments)) setAppointments(data.appointments);
                if (Array.isArray(data.inventory)) setInventory(data.inventory);
                if (Array.isArray(data.labOrders)) setLabOrders(data.labOrders);
                if (Array.isArray(data.patients)) setPatientsList(data.patients);
                if (Array.isArray(data.transactions)) setTransactions(data.transactions);
                showToast('Backup restaurado com sucesso!', 'success');
              }}
              currentUserRole={currentUserRole}
              stats={{
                appointmentsCount: appointments.length,
                patientsCount: patientsList.length,
                inventoryCount: inventory.length,
                labOrdersCount: labOrders.length,
                transactionsCount: transactions.length
              }}
            />
          )}
        </Suspense>
      </main>

      {/* 4. MODAIS OPERACIONAIS */}
      <ConsentModal
        isOpen={modals.isConsentModalOpen}
        onClose={() => modals.setIsConsentModalOpen(false)}
        patientId={activePatient.id}
        patientName={activePatient.name}
        patientCpf={activePatient.cpf}
        patientBirthDate={activePatient.birthDate}
        dentistName={clinicSettings.dentistName}
        dentistCro={clinicSettings.dentistCro}
        procedures={plannedProceduresForConsent}
        onConsentSigned={() => {
          showToast('TCLE digital assinado e arquivado com carimbo de tempo!', 'success');
        }}
      />

      <ReceptionAnamnesisModal
        isOpen={modals.isAnamnesisModalOpen}
        onClose={() => modals.setIsAnamnesisModalOpen(false)}
        patientId={activePatient.id}
        patientName={activePatient.name}
        patientCpf={activePatient.cpf}
        onSaveAnamnesis={handleSaveAnamnesis}
      />

      {(() => {
        const targetPatientName = modals.selectedAppointmentForCheckout?.patientName || activePatient.name;
        const matchedPatient = patientsList.find(
          (p) => p.name.toLowerCase() === targetPatientName.toLowerCase() || p.id === activePatient.id
        );
        const treatmentItems = matchedPatient?.treatmentItems || [];
        const pendingAmount = matchedPatient?.pendingBudgetAmount;
        const fallbackTotal = modals.selectedAppointmentForCheckout
          ? (modals.selectedAppointmentForCheckout.procedure.includes('16') ? 320.0 : 500.0)
          : 350.0;
        const totalDue = pendingAmount && pendingAmount > 0 ? pendingAmount : fallbackTotal;
        const summary = treatmentItems.length > 0
          ? treatmentItems.map((i) => {
              const label = i.procedureName || i.name || 'Procedimento';
              return i.toothNumber ? `${label} (D.${i.toothNumber})` : label;
            }).join(' + ')
          : (modals.selectedAppointmentForCheckout?.procedure || 'Consulta Odontológica / Procedimento Clínico');

        return (
          <CheckoutModal
            isOpen={modals.isCheckoutModalOpen}
            onClose={() => {
              modals.setIsCheckoutModalOpen(false);
              modals.setSelectedAppointmentForCheckout(null);
            }}
            patientName={targetPatientName}
            patientCpf={
              matchedPatient?.cpf ||
              (modals.selectedAppointmentForCheckout ? '342.981.458-20' : activePatient.cpf)
            }
            totalDue={totalDue}
            procedureSummary={summary}
            treatmentItems={treatmentItems}
            isAlreadyPaid={Boolean(modals.selectedAppointmentForCheckout?.paid)}
            isStandalone={!modals.selectedAppointmentForCheckout}
            patientsList={patientsList}
            defaultDebitFee={clinicSettings.debitCardFee}
            defaultCreditFee={clinicSettings.creditCardFee}
            pixKey={clinicSettings.pixKey}
            onPaymentCompleted={handlePaymentCompleted}
          />
        );
      })()}

      <ReceiptModal
        isOpen={modals.isReceiptModalOpen}
        onClose={() => modals.setIsReceiptModalOpen(false)}
        checkoutData={modals.checkoutData}
        patientPhone={
          patientsList.find((p) => p.name === modals.checkoutData?.patientName)?.phone ||
          modals.selectedAppointmentForCheckout?.patientPhone ||
          activePatient.phone
        }
        dentistName={clinicSettings.dentistName}
        dentistCro={clinicSettings.dentistCro}
        dentistCpf={clinicSettings.dentistCpf}
        clinicAddress={clinicSettings.clinicAddress}
      />

      <AppointmentModal
        isOpen={modals.isAppointmentModalOpen}
        onClose={modals.closeAppointmentModal}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        appointmentToEdit={modals.appointmentToEdit}
        initialPatientName={modals.selectedPatientForAppointment}
        existingAppointments={appointments}
        registeredPatients={patientsList}
      />

      <InventoryModal
        isOpen={modals.isInventoryModalOpen}
        onClose={modals.closeInventoryModal}
        onSave={handleSaveInventoryItem}
        itemToEdit={modals.inventoryItemToEdit}
      />

      <LabOrderModal
        isOpen={modals.isLabOrderModalOpen}
        onClose={modals.closeLabOrderModal}
        onSave={handleSaveLabOrder}
        orderToEdit={modals.labOrderToEdit}
        patientNames={patientsList.map((p) => p.name)}
      />

      <PrescriptionModal
        isOpen={modals.isPrescriptionModalOpen}
        onClose={() => modals.setIsPrescriptionModalOpen(false)}
        patientName={activePatient.name}
        patientCpf={activePatient.cpf}
        patientPhone={activePatient.phone}
        patientAllergies={activePatient.medicalAlerts.allergies}
        dentistName={clinicSettings.dentistName}
        dentistCro={clinicSettings.dentistCro}
        dentistCpf={clinicSettings.dentistCpf}
        clinicAddress={clinicSettings.clinicAddress}
      />

      <PatientModal
        isOpen={modals.isPatientModalOpen}
        onClose={modals.closePatientModal}
        onSave={handleSavePatient}
        patientToEdit={modals.patientToEdit}
      />

      <DentistPinModal
        isOpen={modals.isPinModalOpen}
        onClose={() => modals.setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        correctPin={clinicSettings.dentistPin || '1234'}
        dentistName={clinicSettings.dentistName}
      />

      <ClinicalDocumentModal
        isOpen={modals.isDocumentModalOpen}
        onClose={() => modals.setIsDocumentModalOpen(false)}
        patientName={activePatient.name}
        patientCpf={activePatient.cpf}
        patientPhone={activePatient.phone}
        dentistName={clinicSettings.dentistName}
        dentistCro={clinicSettings.dentistCro}
        clinicAddress={clinicSettings.clinicAddress}
      />

      <ReceptionistSwitchModal
        isOpen={modals.isReceptionistSwitchModalOpen}
        onClose={() => modals.setIsReceptionistSwitchModalOpen(false)}
        clinicSettings={clinicSettings}
        onSelectReceptionist={(member: ReceptionistProfile) => {
          setClinicSettings((prev) => ({
            ...prev,
            receptionistName: member.name,
            receptionistRoleTitle: member.roleTitle,
            receptionistCpf: member.cpf || prev.receptionistCpf,
            receptionistPhone: member.phone || prev.receptionistPhone,
            receptionistEmail: member.email || prev.receptionistEmail,
            receptionistSchedule: member.schedule || prev.receptionistSchedule,
            receptionistWorkDays: member.workDays || prev.receptionistWorkDays,
            receptionistsTeam: (prev.receptionistsTeam || []).map((t) => ({
              ...t,
              active: t.id === member.id
            }))
          }));
          showToast(`Operador alterado para ${member.name}`, 'info');
        }}
        onAddReceptionist={(newMember: ReceptionistProfile) => {
          setClinicSettings((prev) => {
            const existingTeam = prev.receptionistsTeam || [];
            const updatedTeam = [
              ...existingTeam.map((t) => ({ ...t, active: false })),
              { ...newMember, active: true }
            ];
            return {
              ...prev,
              receptionistName: newMember.name,
              receptionistRoleTitle: newMember.roleTitle,
              receptionistPhone: newMember.phone || prev.receptionistPhone,
              receptionistSchedule: newMember.schedule || prev.receptionistSchedule,
              receptionistsTeam: updatedTeam
            };
          });
          showToast(`Recepcionista ${newMember.name} cadastrado`, 'success');
        }}
      />

      <ActivePatientSwitchModal
        isOpen={modals.isActivePatientSwitchModalOpen}
        onClose={() => modals.setIsActivePatientSwitchModalOpen(false)}
        currentActivePatientId={activePatient.id}
        appointments={appointments}
        patientsList={patientsList}
        onSelectPatient={handleSwitchActivePatient}
        onQuickNewPatient={modals.openNewPatientModal}
      />

      {/* 5. NAVEGAÇÃO MOBILE DOCK (FIXA NO RODAPÉ EM CELULARES) */}
      <MobileBottomDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAllScreens={() => modals.setIsMobileMenuOpen(true)}
        counts={{
          patients: counts.patients,
          appointments: counts.appointments
        }}
        isMobileMenuOpen={modals.isMobileMenuOpen}
      />

      {/* 6. DRAWER MOBILE COM TODAS AS TELAS */}
      <MobileDrawer
        isOpen={modals.isMobileMenuOpen}
        onClose={() => modals.setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUserRole={currentUserRole}
        onPinRequired={() => modals.setIsPinModalOpen(true)}
        counts={counts}
        clinicName={clinicSettings.clinicName}
        dentistName={clinicSettings.dentistName}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
