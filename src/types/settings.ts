export type ProcedureCategory = 
  | 'PREVENTIVA'
  | 'DENTISTICA'
  | 'ENDODONTIA'
  | 'PERIODONTIA'
  | 'CIRURGIA'
  | 'PROTESE'
  | 'IMPLANTE'
  | 'ORTODONTIA'
  | 'ESTETICA'
  | 'OUTROS';

export interface ProcedurePricing {
  id: string;
  name: string;
  category: ProcedureCategory;
  price: number;
  conditionKey?: string; // Chave de mapeamento com o Odontograma (ex: 'RESTORATION_RESIN', 'CROWN', etc.)
  estimatedDurationMin?: number;
  active: boolean;
  notes?: string;
}

export interface ReceptionistProfile {
  id: string;
  name: string;
  roleTitle: string; // Ex: 'Recepcionista', 'Secretária', 'Auxiliar de Saúde Bucal (ASB)', 'Gerente de Atendimento'
  cpf: string;
  phone: string;
  email: string;
  schedule: string; // Ex: '08:00 às 17:00'
  workDays: string; // Ex: 'Segunda a Sexta'
  startDate?: string;
  notes?: string;
  active: boolean;
}

export interface ClinicSettings {
  dentistName: string;
  dentistCro: string;
  dentistCpf: string;
  clinicName: string;
  clinicCnpj: string;
  clinicPhone: string;
  clinicAddress: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
  debitCardFee: number;
  creditCardFee: number;
  dentistPin: string; // PIN numérico de segurança (4 dígitos) para acesso ao prontuário e livro caixa
  
  // Parâmetros e Dados da Recepção / Atendimento
  receptionistName: string;
  receptionistRoleTitle: string;
  receptionistCpf: string;
  receptionistPhone: string;
  receptionistEmail: string;
  receptionistSchedule: string;
  receptionistWorkDays: string;
  receptionistNotes: string;
  receptionistsTeam: ReceptionistProfile[];

  // Tabela de Preços e Procedimentos Clínicos
  procedurePricings: ProcedurePricing[];
}

export const DEFAULT_PROCEDURES: ProcedurePricing[] = [
  {
    id: 'proc_1',
    name: 'Avaliação Inicial + Exame Clínico + TCLE',
    category: 'PREVENTIVA',
    price: 150.0,
    estimatedDurationMin: 30,
    active: true,
    notes: 'Inclui anamnese digital e planejamento'
  },
  {
    id: 'proc_2',
    name: 'Profilaxia Completa + Jato de Bicarbonato + Flúor',
    category: 'PREVENTIVA',
    price: 180.0,
    conditionKey: 'HEALTHY',
    estimatedDurationMin: 45,
    active: true,
    notes: 'Limpeza e remoção de placa supragengival'
  },
  {
    id: 'proc_3',
    name: 'Restauração em Resina Composta (1 Face)',
    category: 'DENTISTICA',
    price: 190.0,
    conditionKey: 'RESTORATION_RESIN',
    estimatedDurationMin: 45,
    active: true,
    notes: 'Resina nanoparticulada fotopolimerizável'
  },
  {
    id: 'proc_4',
    name: 'Restauração em Resina Composta (2 ou mais Faces / MOD)',
    category: 'DENTISTICA',
    price: 260.0,
    conditionKey: 'CARIES',
    estimatedDurationMin: 60,
    active: true,
    notes: 'Restauração complexa com matriz e cunha'
  },
  {
    id: 'proc_5',
    name: 'Restauração em Amálgama Dentário',
    category: 'DENTISTICA',
    price: 180.0,
    conditionKey: 'RESTORATION_AMALGAM',
    estimatedDurationMin: 45,
    active: true
  },
  {
    id: 'proc_6',
    name: 'Selante de Fóssulas e Fissuras',
    category: 'PREVENTIVA',
    price: 110.0,
    conditionKey: 'SEALANT',
    estimatedDurationMin: 30,
    active: true
  },
  {
    id: 'proc_7',
    name: 'Tratamento Endodôntico (Canal) Unirradicular',
    category: 'ENDODONTIA',
    price: 550.0,
    estimatedDurationMin: 60,
    active: true
  },
  {
    id: 'proc_8',
    name: 'Tratamento Endodôntico (Canal) Molar / Multirradicular',
    category: 'ENDODONTIA',
    price: 850.0,
    conditionKey: 'ENDODONTIC_NEEDED',
    estimatedDurationMin: 90,
    active: true,
    notes: 'Sistemas rotatórios e obturação termoplastificada'
  },
  {
    id: 'proc_9',
    name: 'Exodontia Simples de Dente Permanente',
    category: 'CIRURGIA',
    price: 220.0,
    conditionKey: 'EXTRACTION_INDICATED',
    estimatedDurationMin: 45,
    active: true
  },
  {
    id: 'proc_10',
    name: 'Exodontia de 3º Molar Incluso / Semi-Incluso (Siso)',
    category: 'CIRURGIA',
    price: 480.0,
    estimatedDurationMin: 60,
    active: true,
    notes: 'Com osteotomia e odontossecção'
  },
  {
    id: 'proc_11',
    name: 'Clareamento Dental Caseiro com Moldeiras de Silicone',
    category: 'ESTETICA',
    price: 750.0,
    estimatedDurationMin: 30,
    active: true,
    notes: 'Inclui 2 moldeiras e 4 seringas de gel clareador'
  },
  {
    id: 'proc_12',
    name: 'Clareamento Dental em Consultório (Laser / LED)',
    category: 'ESTETICA',
    price: 1200.0,
    estimatedDurationMin: 60,
    active: true,
    notes: 'Peróxido de hidrogênio a 35%'
  },
  {
    id: 'proc_13',
    name: 'Coroa Total em Cerâmica Pura (E-Max / Zircônia)',
    category: 'PROTESE',
    price: 1400.0,
    conditionKey: 'CROWN',
    estimatedDurationMin: 60,
    active: true,
    notes: 'Escaneamento digital e cimentação resinosa'
  },
  {
    id: 'proc_14',
    name: 'Implante Dentário Unitário em Titânio (Cirurgia)',
    category: 'IMPLANTE',
    price: 2200.0,
    conditionKey: 'IMPLANT',
    estimatedDurationMin: 60,
    active: true,
    notes: 'Fase cirúrgica com implante cone morse'
  },
  {
    id: 'proc_15',
    name: 'Placa Miorrelaxante de Bruxismo (Acrílico)',
    category: 'PROTESE',
    price: 450.0,
    estimatedDurationMin: 30,
    active: true
  },
  {
    id: 'proc_16',
    name: 'Raspagem e Alisamento Radicular (Por Quadrante)',
    category: 'PERIODONTIA',
    price: 200.0,
    estimatedDurationMin: 45,
    active: true
  }
];

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  dentistName: 'Dra. Juliana Mendes',
  dentistCro: 'CRO-SP 123.456',
  dentistCpf: '123.456.789-00',
  clinicName: 'Consultório Odontológico Dra. Juliana Mendes',
  clinicCnpj: '45.123.789/0001-10',
  clinicPhone: '(11) 98765-4321',
  clinicAddress: 'Av. Paulista, 1000 - Sala 42, Bela Vista, São Paulo - SP',
  pixKey: '45.123.789/0001-10',
  pixKeyType: 'CNPJ',
  debitCardFee: 1.2,
  creditCardFee: 2.8,
  dentistPin: '1234',

  // Dados Padrão da Recepção
  receptionistName: 'Mariana Costa',
  receptionistRoleTitle: 'Recepcionista & Balcão',
  receptionistCpf: '456.789.012-34',
  receptionistPhone: '(11) 97123-4567',
  receptionistEmail: 'recepcao@consultorioodonto.com.br',
  receptionistSchedule: '08:00 às 17:00 (1h de almoço)',
  receptionistWorkDays: 'Segunda a Sexta-feira',
  receptionistNotes: 'Responsável pelo acolhimento presencial, confirmações ativas no WhatsApp, triagem inicial no tablet e conferência de maquininha de cartão no fechamento diário.',
  receptionistsTeam: [
    {
      id: 'rec_01',
      name: 'Mariana Costa',
      roleTitle: 'Recepcionista & Balcão',
      cpf: '456.789.012-34',
      phone: '(11) 97123-4567',
      email: 'recepcao@consultorioodonto.com.br',
      schedule: '08:00 às 17:00',
      workDays: 'Segunda a Sexta-feira',
      startDate: '2024-02-15',
      notes: 'Operadora titular do balcão e agenda.',
      active: true
    }
  ],

  // Tabela Padrão de Preços
  procedurePricings: DEFAULT_PROCEDURES
};

