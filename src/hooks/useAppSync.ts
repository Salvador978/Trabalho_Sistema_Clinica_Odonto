import { useEffect } from 'react';
import { api } from '../services/api';
import { 
  loadFromStorage, 
  saveToStorage, 
  getPatients, 
  syncPatientsWithServer, 
  getActiveRole 
} from '../services/storage';
import { ClinicSettings, DEFAULT_CLINIC_SETTINGS } from '../types/settings';
import { Patient } from '../types/patient';
import { AppointmentItem } from '../components/schedule/AppointmentModal';
import { Transaction } from '../components/financial/CashbookView';
import { LabOrder } from '../components/prosthetics/LabOrderModal';
import { InventoryItem } from '../components/inventory/InventoryModal';
import { ClinicalEvolution, DEFAULT_EVOLUTIONS } from '../data/seedEvolutions';
import { DEFAULT_APPOINTMENTS } from '../data/seedAppointments';
import { DEFAULT_TRANSACTIONS } from '../data/seedTransactions';
import { DEFAULT_LAB_ORDERS } from '../data/seedLabOrders';
import { DEFAULT_INVENTORY } from '../data/seedInventory';
import { ClinicSession, UserRole } from '../types/auth';
import { useDebouncedSave } from './useDebouncedSave';

interface UseAppSyncParams {
  session: ClinicSession | null;
  clinicSettings: ClinicSettings;
  setClinicSettings: React.Dispatch<React.SetStateAction<ClinicSettings>>;
  patientsList: Patient[];
  setPatientsList: React.Dispatch<React.SetStateAction<Patient[]>>;
  appointments: AppointmentItem[];
  setAppointments: React.Dispatch<React.SetStateAction<AppointmentItem[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  labOrders: LabOrder[];
  setLabOrders: React.Dispatch<React.SetStateAction<LabOrder[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  clinicalEvolutions: ClinicalEvolution[];
  setClinicalEvolutions: React.Dispatch<React.SetStateAction<ClinicalEvolution[]>>;
  setCurrentUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  onPatientLoaded?: (patients: Patient[]) => void;
}

export function useAppSync({
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
  onPatientLoaded
}: UseAppSyncParams) {
  const activeId = session?.clinicId;

  // 1. Reidratação isolada quando a clínica logada mudar
  useEffect(() => {
    if (!session) return;
    const cid = session.clinicId;
    const loadedSettings = loadFromStorage('SETTINGS', DEFAULT_CLINIC_SETTINGS, cid);
    const finalDentistName = loadedSettings.dentistName || session.dentistName;
    let finalClinicName = loadedSettings.clinicName || session.clinicName;

    if (
      (!finalClinicName || finalClinicName === 'Consultório Odontológico Dra. Juliana Mendes') &&
      finalDentistName &&
      finalDentistName !== 'Dra. Juliana Mendes'
    ) {
      finalClinicName = `Consultório Odontológico ${finalDentistName}`;
    }

    setClinicSettings({
      ...DEFAULT_CLINIC_SETTINGS,
      ...loadedSettings,
      clinicName: finalClinicName,
      dentistName: finalDentistName,
      dentistCro: loadedSettings.dentistCro || session.dentistCro
    });

    const currentPatients = getPatients(cid);
    setPatientsList(currentPatients);
    if (onPatientLoaded) onPatientLoaded(currentPatients);

    // Sincronização com o backend Express + SQLite
    api.settings.get().then((serverSettings) => {
      if (serverSettings && (serverSettings.clinicName || serverSettings.dentistName)) {
        const isServerCustom = serverSettings.dentistName && serverSettings.dentistName !== 'Dra. Juliana Mendes';
        const isLocalCustom = loadedSettings.dentistName && loadedSettings.dentistName !== 'Dra. Juliana Mendes';

        if (isServerCustom || !isLocalCustom) {
          setClinicSettings((prev) => ({ ...prev, ...serverSettings }));
          saveToStorage('SETTINGS', serverSettings, cid);
        } else if (isLocalCustom && !isServerCustom) {
          api.settings.update(loadedSettings).catch(() => {});
        }
      }
    }).catch(() => {});

    syncPatientsWithServer(cid).then((serverPatients) => {
      if (serverPatients && serverPatients.length > 0) {
        setPatientsList(serverPatients);
        if (onPatientLoaded) onPatientLoaded(serverPatients);
      }
    }).catch(() => {});

    api.schedule.list().then((serverApps) => {
      if (Array.isArray(serverApps) && serverApps.length > 0) {
        setAppointments(serverApps);
        saveToStorage('APPOINTMENTS', serverApps, cid);
      }
    }).catch(() => {});

    api.financial.getTransactions().then((serverTxs) => {
      if (Array.isArray(serverTxs) && serverTxs.length > 0) {
        setTransactions(serverTxs);
        saveToStorage('TRANSACTIONS', serverTxs, cid);
      }
    }).catch(() => {});

    api.aux.getLabOrders().then((serverLabs) => {
      if (Array.isArray(serverLabs) && serverLabs.length > 0) {
        setLabOrders(serverLabs);
        saveToStorage('LAB_ORDERS', serverLabs, cid);
      }
    }).catch(() => {});

    api.aux.getInventory().then((serverInv) => {
      if (Array.isArray(serverInv) && serverInv.length > 0) {
        setInventory(serverInv);
        saveToStorage('INVENTORY', serverInv, cid);
      }
    }).catch(() => {});

    setAppointments(loadFromStorage('APPOINTMENTS', DEFAULT_APPOINTMENTS, cid));
    setTransactions(loadFromStorage('TRANSACTIONS', DEFAULT_TRANSACTIONS, cid));
    setLabOrders(loadFromStorage('LAB_ORDERS', DEFAULT_LAB_ORDERS, cid));
    setInventory(loadFromStorage('INVENTORY', DEFAULT_INVENTORY, cid));
    setClinicalEvolutions(loadFromStorage('CLINICAL_EVOLUTIONS', DEFAULT_EVOLUTIONS, cid));

    const activeRole = getActiveRole(cid);
    setCurrentUserRole(activeRole);
    if (activeRole === 'RECEPTIONIST') {
      setActiveTab('SCHEDULE');
    }
  }, [session?.clinicId]);

  // 2. Sincronização ao alternar foco de janela (Celular <-> Computador)
  useEffect(() => {
    if (!activeId) return;

    const handleWindowFocus = () => {
      api.settings.get().then((serverSettings) => {
        if (serverSettings && (serverSettings.clinicName || serverSettings.dentistName)) {
          setClinicSettings((prev) => ({ ...prev, ...serverSettings }));
        }
      }).catch(() => {});

      syncPatientsWithServer(activeId).then((serverPatients) => {
        if (serverPatients && serverPatients.length > 0) {
          setPatientsList(serverPatients);
        }
      }).catch(() => {});

      api.schedule.list().then((serverApps) => {
        if (Array.isArray(serverApps) && serverApps.length > 0) {
          setAppointments(serverApps);
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [activeId]);

  // 3. Auto-save com Debounce
  useDebouncedSave('SETTINGS', clinicSettings, activeId);
  useDebouncedSave('PATIENTS', patientsList, activeId);
  useDebouncedSave('APPOINTMENTS', appointments, activeId);
  useDebouncedSave('TRANSACTIONS', transactions, activeId);
  useDebouncedSave('LAB_ORDERS', labOrders, activeId);
  useDebouncedSave('INVENTORY', inventory, activeId);
  useDebouncedSave('CLINICAL_EVOLUTIONS', clinicalEvolutions, activeId);
}
