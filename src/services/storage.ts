/**
 * MOTOR DE PERSISTÊNCIA LOCAL-FIRST MULTI-TENANT (RESILIENTE A F5 E OFFLINE)
 * Suporte multi-clínicas com isolamento estrito de prontuários, configurações e cadastros.
 * Permite comercializar o sistema SaaS para múltiplos consultórios independentes.
 */
import { Patient } from '../types/patient';
import { ClinicAccount, ClinicSession, NewClinicPayload, UserRole } from '../types/auth';
import { api } from './api';

export const STORAGE_KEYS = {
  SETTINGS: 'gerencia_odonto_settings_v1',
  APPOINTMENTS: 'gerencia_odonto_appointments_v1',
  INVENTORY: 'gerencia_odonto_inventory_v1',
  LAB_ORDERS: 'gerencia_odonto_lab_orders_v1',
  PATIENTS: 'gerencia_odonto_patients_v1',
  TRANSACTIONS: 'gerencia_odonto_transactions_v1',
  RADIOGRAPHS: 'gerencia_odonto_radiographs_v1',
  CLINICAL_EVOLUTIONS: 'gerencia_odonto_evolutions_v1',
  CLINICS: 'gerencia_odonto_clinics_v1',
  SESSION: 'gerencia_odonto_session_v1',
  ACTIVE_ROLE: 'gerencia_odonto_active_role_v1'
} as const;

export interface BackupPayload {
  version: string;
  clinicId?: string;
  exportedAt: string;
  data: {
    settings?: any;
    appointments?: any[];
    inventory?: any[];
    labOrders?: any[];
    patients?: any[];
    transactions?: any[];
    radiographs?: any[];
    evolutions?: any[];
  };
}

/**
 * CONTA OFICIAL DA CLÍNICA
 */
export const DEFAULT_CLINICS: ClinicAccount[] = [
  {
    id: 'clinica_odonto',
    name: 'Consultório Odontológico Dra. Juliana Mendes',
    login: 'admin@consultorio.com',
    password: 'senha123',
    dentistName: 'Dra. Juliana Mendes',
    dentistCro: 'CRO-SP 123.456',
    receptionistName: 'Recepção',
    phone: '(11) 98765-4321',
    email: 'admin@consultorio.com',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Paulista, 1000 - Cj. 42 - Bela Vista',
    plan: 'PRO',
    active: true,
    createdAt: '2026-01-01T08:00:00.000Z'
  }
];

const STORAGE_CLEANUP_VERSION = 'gerencia_odonto_cleaned_v2';

// Limpeza única e automática de dados fictícios prévios armazenados no navegador
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    if (localStorage.getItem(STORAGE_CLEANUP_VERSION) !== 'true') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('gerencia_odonto_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(DEFAULT_CLINICS));
      localStorage.setItem(STORAGE_CLEANUP_VERSION, 'true');
    }
  } catch {
    // Ignore restricted localStorage environments
  }
}

/**
 * GERENCIAMENTO DE SESSÃO MULTI-CLÍNICA
 */
export const getActiveSession = (): ClinicSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveActiveSession = (session: ClinicSession | null): void => {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Erro ao salvar sessão ativa:', err);
  }
};

export const clearActiveSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
};

/**
 * CONTROLE DE PAPEL ATIVO (DENTISTA VS RECEPÇÃO) RESILIENTE A F5
 * Previne que atualizar a página burle o PIN do dentista.
 */
export const getActiveRole = (clinicId?: string): UserRole => {
  try {
    const activeId = clinicId || getActiveSession()?.clinicId;
    const roleKey = activeId ? `${STORAGE_KEYS.ACTIVE_ROLE}_${activeId}` : STORAGE_KEYS.ACTIVE_ROLE;
    const saved = localStorage.getItem(roleKey);

    if (saved === 'RECEPTIONIST') {
      return 'RECEPTIONIST';
    }

    if (saved === 'DENTIST') {
      // Verifica se a sessão do dentista foi validada com PIN nesta aba do navegador
      const isSessionUnlocked = sessionStorage.getItem(`dentist_unlocked_${activeId || 'default'}`);
      if (isSessionUnlocked === 'true') {
        return 'DENTIST';
      }
      // Se não houver autenticação ativa nesta sessão, protege mantendo como RECEPÇÃO!
      return 'RECEPTIONIST';
    }

    // Padrão seguro para novos acessos e terminais
    return 'RECEPTIONIST';
  } catch {
    return 'RECEPTIONIST';
  }
};

export const saveActiveRole = (role: UserRole, clinicId?: string): void => {
  try {
    const activeId = clinicId || getActiveSession()?.clinicId;
    const roleKey = activeId ? `${STORAGE_KEYS.ACTIVE_ROLE}_${activeId}` : STORAGE_KEYS.ACTIVE_ROLE;
    localStorage.setItem(roleKey, role);

    const sessionKey = `dentist_unlocked_${activeId || 'default'}`;
    if (role === 'RECEPTIONIST') {
      sessionStorage.removeItem(sessionKey);
    } else if (role === 'DENTIST') {
      sessionStorage.setItem(sessionKey, 'true');
    }
  } catch (err) {
    console.error('Erro ao salvar papel ativo:', err);
  }
};

/**
 * GERENCIAMENTO DE CONTAS DE CLÍNICAS (CADASTRO E AUTENTICAÇÃO)
 */
export const getClinicAccounts = (): ClinicAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLINICS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(DEFAULT_CLINICS));
      return DEFAULT_CLINICS;
    }
    const accounts: ClinicAccount[] = JSON.parse(raw);
    let updated = false;
    for (const def of DEFAULT_CLINICS) {
      if (!accounts.some((a) => a.id === def.id)) {
        accounts.push(def);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    return DEFAULT_CLINICS;
  }
};

export const authenticateClinic = (loginInput: string, passwordInput: string): ClinicAccount | null => {
  const accounts = getClinicAccounts();
  const cleanLogin = loginInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  const found = accounts.find((acc) => {
    const emailMatch = acc.login.toLowerCase() === cleanLogin;
    const usernameMatch =
      acc.id.replace('clinica_', '').toLowerCase() === cleanLogin ||
      acc.name.toLowerCase() === cleanLogin;
    return (emailMatch || usernameMatch) && acc.password === cleanPass;
  });

  return found || null;
};

export const registerClinicTenant = (payload: NewClinicPayload): ClinicAccount => {
  const accounts = getClinicAccounts();
  const slug = payload.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');

  const newId = `clinica_${slug}_${crypto.randomUUID()}`;
  const newAccount: ClinicAccount = {
    id: newId,
    name: payload.name.trim(),
    login: payload.login.trim().toLowerCase(),
    password: payload.password.trim(),
    dentistName: payload.dentistName.trim(),
    dentistCro: payload.dentistCro.trim(),
    receptionistName: 'Recepção',
    phone: payload.phone || '',
    email: payload.login.trim(),
    city: payload.city || '',
    state: payload.state || '',
    address: `${payload.city || ''} ${payload.state || ''}`.trim(),
    plan: 'PRO',
    active: true,
    createdAt: new Date().toISOString()
  };

  const updated = [...accounts, newAccount];
  localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(updated));

  // Inicializa banco de dados zerado e configurado para a nova clínica
  const initialSettings = {
    clinicName: newAccount.name,
    dentistName: newAccount.dentistName,
    dentistCro: newAccount.dentistCro,
    clinicCpfCnpj: '',
    clinicAddress: newAccount.address,
    clinicPhone: newAccount.phone,
    clinicEmail: newAccount.email,
    receptionistName: 'Recepção',
    receptionistPhone: newAccount.phone,
    receptionistShift: 'Comercial (08:00 às 18:00)',
    receptionistNotes: 'Controle de agendamentos e recepção.',
    pixKey: newAccount.email,
    pixKeyType: 'EMAIL',
    cardFeeDebit: 1.49,
    cardFeeCreditSight: 3.19,
    cardFeeCreditInstallment: 4.49,
    cardMachineName: 'Maquininha Própria'
  };

  saveToStorage('SETTINGS', initialSettings, newId);
  saveToStorage('PATIENTS', [], newId);
  saveToStorage('APPOINTMENTS', [], newId);
  saveToStorage('TRANSACTIONS', [], newId);
  saveToStorage('INVENTORY', [], newId);
  saveToStorage('LAB_ORDERS', [], newId);
  saveToStorage('RADIOGRAPHS', [], newId);
  saveToStorage('CLINICAL_EVOLUTIONS', [], newId);

  return newAccount;
};

/**
 * MOTOR DE STORAGE ISOLADO POR TENANT (MULTI-CLÍNICA)
 */
export const loadFromStorage = <T>(
  key: keyof typeof STORAGE_KEYS,
  fallback: T,
  clinicId?: string
): T => {
  try {
    const activeId = clinicId || getActiveSession()?.clinicId;

    if (key === 'CLINICS' || key === 'SESSION') {
      const raw = localStorage.getItem(STORAGE_KEYS[key]);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    }

    if (activeId) {
      const tenantKey = `${STORAGE_KEYS[key]}_${activeId}`;
      const raw = localStorage.getItem(tenantKey);
      if (raw) return JSON.parse(raw) as T;


    } else {
      const raw = localStorage.getItem(STORAGE_KEYS[key]);
      if (raw) return JSON.parse(raw) as T;
    }

    return fallback;
  } catch (err) {
    console.warn(`Erro ao carregar chave ${key} do LocalStorage:`, err);
    return fallback;
  }
};

export const saveToStorage = <T>(
  key: keyof typeof STORAGE_KEYS,
  data: T,
  clinicId?: string
): void => {
  try {
    const activeId = clinicId || getActiveSession()?.clinicId;
    const targetKey =
      activeId && key !== 'CLINICS' && key !== 'SESSION'
        ? `${STORAGE_KEYS[key]}_${activeId}`
        : STORAGE_KEYS[key];

    localStorage.setItem(targetKey, JSON.stringify(data));
  } catch (err) {
    console.error(`Erro ao salvar chave ${key} no LocalStorage:`, err);
  }
};

export const clearAppStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
};

/**
 * BANCO DE PACIENTES INICIAIS (ZERADO PARA NOVOS CADASTROS)
 */
export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_PATIENTS_SORRISO_VIP: Patient[] = [];
export const INITIAL_PATIENTS_IMPLANTE_ARTE: Patient[] = [];

export const getInitialPatientsForClinic = (_clinicId?: string): Patient[] => {
  return [];
};

export const getPatients = (clinicId?: string): Patient[] => {
  const activeId = clinicId || getActiveSession()?.clinicId;
  const initialData = getInitialPatientsForClinic(activeId);
  const loaded = loadFromStorage<any[]>('PATIENTS', initialData, activeId);
  if (!Array.isArray(loaded) || loaded.length === 0) {
    if (initialData.length > 0) {
      saveToStorage('PATIENTS', initialData, activeId);
      return initialData;
    }
    return [];
  }
  return loaded;
};

export const savePatients = (patients: Patient[], clinicId?: string): void => {
  const activeId = clinicId || getActiveSession()?.clinicId;
  saveToStorage('PATIENTS', patients, activeId);
};

export const savePatient = (patient: Patient, clinicId?: string): void => {
  const current = getPatients(clinicId);
  const exists = current.some((p) => p.id === patient.id);
  let updated: Patient[];
  if (exists) {
    updated = current.map((p) => (p.id === patient.id ? patient : p));
  } else {
    updated = [patient, ...current];
  }
  savePatients(updated, clinicId);

  // Sincronização assíncrona com o banco SQLite no backend
  if (exists) {
    api.patients.update(patient.id, patient).catch((err) => {
      console.warn('Sincronização com backend pendente (armazenado localmente):', err);
    });
  } else {
    api.patients.create(patient).catch((err) => {
      console.warn('Criação no backend pendente (armazenado localmente):', err);
    });
  }
};

export const deletePatient = (patientId: string, clinicId?: string): void => {
  const current = getPatients(clinicId);
  const filtered = current.filter((p) => p.id !== patientId);
  savePatients(filtered, clinicId);

  // Exclusão no backend (valida RBAC e grava audit log no SQLite)
  api.patients.delete(patientId).catch((err) => {
    console.warn('Exclusão no backend falhou:', err);
  });
};

/**
 * SINCRONIZAÇÃO DE PACIENTES COM O BACKEND
 */
export const syncPatientsWithServer = async (clinicId?: string): Promise<Patient[]> => {
  try {
    const serverPatients = await api.patients.list();
    if (Array.isArray(serverPatients)) {
      savePatients(serverPatients, clinicId);
      return serverPatients;
    }
  } catch (err) {
    console.warn('Backend offline ou não autenticado, usando cache local:', err);
  }
  return getPatients(clinicId);
};

/**
 * GERAÇÃO DE BACKUP LOCAL ISOLADO POR CLÍNICA
 */
export const generateBackupPayload = (clinicId?: string): BackupPayload => {
  const activeId = clinicId || getActiveSession()?.clinicId;
  return {
    version: '1.0.0',
    clinicId: activeId,
    exportedAt: new Date().toISOString(),
    data: {
      settings: loadFromStorage('SETTINGS', null, activeId),
      appointments: loadFromStorage('APPOINTMENTS', [], activeId),
      inventory: loadFromStorage('INVENTORY', [], activeId),
      labOrders: loadFromStorage('LAB_ORDERS', [], activeId),
      patients: getPatients(activeId),
      transactions: loadFromStorage('TRANSACTIONS', [], activeId),
      radiographs: loadFromStorage('RADIOGRAPHS', [], activeId),
      evolutions: loadFromStorage('CLINICAL_EVOLUTIONS', [], activeId)
    }
  };
};

export const downloadBackupJson = (dentistCro: string = 'CRO-SP', clinicId?: string): void => {
  const payload = generateBackupPayload(clinicId);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const cleanCro = dentistCro.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `backup_consultorio_${cleanCro}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const restoreBackupPayload = (
  payload: any,
  clinicId?: string
): { success: boolean; message: string; data?: BackupPayload['data'] } => {
  try {
    const activeId = clinicId || getActiveSession()?.clinicId;
    if (!payload || typeof payload !== 'object') {
      return { success: false, message: 'Arquivo JSON inválido ou vazio.' };
    }

    const data = payload.data || payload;

    if (data.settings) saveToStorage('SETTINGS', data.settings, activeId);
    if (Array.isArray(data.appointments)) saveToStorage('APPOINTMENTS', data.appointments, activeId);
    if (Array.isArray(data.inventory)) saveToStorage('INVENTORY', data.inventory, activeId);
    if (Array.isArray(data.labOrders)) saveToStorage('LAB_ORDERS', data.labOrders, activeId);
    if (Array.isArray(data.patients)) savePatients(data.patients, activeId);
    if (Array.isArray(data.transactions)) saveToStorage('TRANSACTIONS', data.transactions, activeId);
    if (Array.isArray(data.radiographs)) saveToStorage('RADIOGRAPHS', data.radiographs, activeId);
    if (Array.isArray(data.evolutions)) saveToStorage('CLINICAL_EVOLUTIONS', data.evolutions, activeId);

    return {
      success: true,
      message: 'Backup restaurado com sucesso no armazenamento da clínica!',
      data
    };
  } catch (err) {
    return {
      success: false,
      message: `Erro ao processar arquivo de restauração: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
    };
  }
};
