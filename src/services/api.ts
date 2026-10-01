/**
 * CLIENTE HTTP DE INTEGRAÇÃO COM BACKEND EXPRESS + SQLITE
 * Gerencia autenticação JWT, cabeçalhos, tratamento de erros e chamadas tipadas.
 */

import { Patient } from '../types/patient';
import { ClinicSession, UserRole } from '../types/auth';
import { ClinicSettings } from '../types/settings';
import { AppointmentItem } from '../components/schedule/AppointmentModal';
import { Transaction } from '../components/financial/CashbookView';
import { LabOrder } from '../components/prosthetics/LabOrderModal';
import { InventoryItem } from '../components/inventory/InventoryModal';
import { ClinicalEvolution } from '../data/seedEvolutions';

const TOKEN_KEY = 'gerencia_odonto_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  if (endpoint.startsWith('/api') && API_BASE === '/api') {
    return endpoint;
  }
  if (endpoint.startsWith('/api')) {
    const subpath = endpoint.substring(4);
    return `${API_BASE.replace(/\/$/, '')}${subpath}`;
  }
  return `${API_BASE.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = buildUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Erro ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMsg = errorJson.error;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // --- AUTENTICAÇÃO & ELEVAÇÃO VIA PIN ---
  auth: {
    async login(login: string, password: string): Promise<{ token: string; session: ClinicSession }> {
      const data = await request<{ token: string; session: ClinicSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password })
      });
      setStoredToken(data.token);
      return data;
    },

    async elevate(pin: string): Promise<{ token: string; role: UserRole; message: string }> {
      const data = await request<{ token: string; role: UserRole; message: string }>('/api/auth/elevate', {
        method: 'POST',
        body: JSON.stringify({ pin })
      });
      setStoredToken(data.token);
      return data;
    },

    async changePin(newPin: string): Promise<{ success: boolean; message: string }> {
      return request('/api/auth/change-pin', {
        method: 'POST',
        body: JSON.stringify({ newPin })
      });
    },

    async getMe(): Promise<any> {
      return request('/api/auth/me');
    },

    logout(): void {
      setStoredToken(null);
    }
  },

  // --- PACIENTES (COM PROTEÇÃO LGPD / RBAC) ---
  patients: {
    async list(): Promise<Patient[]> {
      return request<Patient[]>('/api/patients');
    },

    async get(id: string): Promise<Patient> {
      return request<Patient>(`/api/patients/${id}`);
    },

    async create(patient: Partial<Patient>): Promise<Patient> {
      return request<Patient>('/api/patients', {
        method: 'POST',
        body: JSON.stringify(patient)
      });
    },

    async update(id: string, patient: Partial<Patient>): Promise<Patient> {
      return request<Patient>(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patient)
      });
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return request<{ success: boolean; message: string }>(`/api/patients/${id}`, {
        method: 'DELETE'
      });
    },

    async saveAnamnesis(patientId: string, payload: {
      hasHypertension?: boolean;
      hasDiabetes?: boolean;
      isAnticoagulated?: boolean;
      allergies?: string[];
      medicalAlerts?: string;
      signatureDataUrl?: string;
      hashSha256?: string;
    }): Promise<{ success: boolean; message: string; documentId?: string }> {
      return request<{ success: boolean; message: string; documentId?: string }>(`/api/patients/${patientId}/anamnesis`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  // --- DOCUMENTOS CLÍNICOS & TCLE (COM HASH SHA-256) ---
  documents: {
    async listForPatient(patientId: string, type?: string): Promise<any[]> {
      const query = type ? `?type=${encodeURIComponent(type)}` : '';
      return request<any[]>(`/api/documents/patient/${patientId}${query}`);
    },

    async save(docPayload: {
      patientId: string;
      patientName: string;
      type: string;
      title: string;
      sha256Hash?: string;
      signatureBase64?: string;
      dentistCro?: string;
      content: any;
    }): Promise<any> {
      return request('/api/documents', {
        method: 'POST',
        body: JSON.stringify(docPayload)
      });
    },

    async delete(id: string): Promise<{ success: boolean }> {
      return request(`/api/documents/${id}`, { method: 'DELETE' });
    }
  },

  // --- CLÍNICA: EVOLUÇÕES & ODONTOGRAMA ---
  clinical: {
    async getEvolutions(patientId: string): Promise<ClinicalEvolution[]> {
      return request<ClinicalEvolution[]>(`/api/clinical/evolutions/patient/${patientId}`);
    },

    async addEvolution(payload: {
      patientId: string;
      patientName: string;
      procedure: string;
      tooth?: string;
      text: string;
      sterilizationLot: string;
      date?: string;
    }): Promise<ClinicalEvolution> {
      return request<ClinicalEvolution>('/api/clinical/evolutions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    async getOdontogram(patientId: string): Promise<{ findings: any[] }> {
      return request<{ findings: any[] }>(`/api/clinical/odontogram/patient/${patientId}`);
    },

    async saveOdontogram(
      payloadOrPatientId: string | {
        patientId: string;
        layer?: string;
        teeth?: any;
        findings?: any;
        updatedAt?: string;
      },
      findingsParam?: any[]
    ): Promise<{ success: boolean }> {
      let patientId: string;
      let body: any;

      if (typeof payloadOrPatientId === 'string') {
        patientId = payloadOrPatientId;
        body = { findings: findingsParam || [] };
      } else {
        patientId = payloadOrPatientId.patientId;
        body = {
          findings: payloadOrPatientId.findings || payloadOrPatientId.teeth || [],
          teeth: payloadOrPatientId.teeth,
          layer: payloadOrPatientId.layer,
          updatedAt: payloadOrPatientId.updatedAt
        };
      }

      return request<{ success: boolean }>(`/api/clinical/odontogram/patient/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    }
  },

  // --- AGENDA & FLUXO DE ATENDIMENTO ---
  schedule: {
    async list(date?: string): Promise<AppointmentItem[]> {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<AppointmentItem[]>(`/api/schedule${query}`);
    },

    async save(appointment: AppointmentItem): Promise<AppointmentItem> {
      return request<AppointmentItem>('/api/schedule', {
        method: 'POST',
        body: JSON.stringify(appointment)
      });
    },

    async updateStatus(id: string, status: string, whatsappStatus?: string): Promise<any> {
      return request(`/api/schedule/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ newStatus: status, whatsappStatus })
      });
    },

    async delete(id: string): Promise<{ success: boolean }> {
      return request(`/api/schedule/${id}`, { method: 'DELETE' });
    }
  },

  // --- FINANCEIRO, LIVRO CAIXA & FECHAMENTO ---
  financial: {
    async getTransactions(date?: string): Promise<Transaction[]> {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<Transaction[]>(`/api/financial/transactions${query}`);
    },

    async createTransaction(tx: Partial<Transaction>): Promise<Transaction> {
      return request<Transaction>('/api/financial/transactions', {
        method: 'POST',
        body: JSON.stringify(tx)
      });
    },

    async deleteTransaction(id: string): Promise<{ success: boolean }> {
      return request(`/api/financial/transactions/${id}`, { method: 'DELETE' });
    },

    async getCashierClosings(date?: string): Promise<any[]> {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<any[]>(`/api/financial/cashier-closings${query}`);
    },

    async saveCashierClosing(closing: any): Promise<any> {
      return request('/api/financial/cashier-closings', {
        method: 'POST',
        body: JSON.stringify(closing)
      });
    }
  },

  // --- CONFIGURAÇÕES DA CLÍNICA ---
  settings: {
    async get(): Promise<ClinicSettings> {
      return request<ClinicSettings>('/api/settings');
    },

    async update(settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
      return request<ClinicSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    }
  },

  // --- AUXILIARES (AUTOCLAVE RDC 15, PROTÉTICOS, ESTOQUE) ---
  aux: {
    async getAutoclaveLogs(): Promise<any[]> {
      return request<any[]>('/api/aux/autoclave');
    },

    async createAutoclaveLog(log: any): Promise<any> {
      return request('/api/aux/autoclave', {
        method: 'POST',
        body: JSON.stringify(log)
      });
    },

    async getLabOrders(): Promise<LabOrder[]> {
      return request<LabOrder[]>('/api/aux/lab-orders');
    },

    async saveLabOrder(order: LabOrder): Promise<LabOrder> {
      return request<LabOrder>('/api/aux/lab-orders', {
        method: 'POST',
        body: JSON.stringify(order)
      });
    },

    async deleteLabOrder(id: string): Promise<{ success: boolean }> {
      return request(`/api/aux/lab-orders/${id}`, { method: 'DELETE' });
    },

    async getInventory(): Promise<InventoryItem[]> {
      return request<InventoryItem[]>('/api/aux/inventory');
    },

    async saveInventory(item: InventoryItem): Promise<InventoryItem> {
      return request<InventoryItem>('/api/aux/inventory', {
        method: 'POST',
        body: JSON.stringify(item)
      });
    },

    async deleteInventory(id: string): Promise<{ success: boolean }> {
      return request(`/api/aux/inventory/${id}`, { method: 'DELETE' });
    }
  }
};
