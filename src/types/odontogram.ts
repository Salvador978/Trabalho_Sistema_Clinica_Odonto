/**
 * DOMÍNIO ODONTOLÓGICO - SISTEMA FDI WORLD DENTAL FEDERATION (ISO 3950)
 * Gerencia Odonto SaaS
 */

/**
 * Faces Anatômicas Dentárias (ISO 3950)
 * M: Mesial (voltada para a linha média)
 * D: Distal (oposta à linha média, voltada para posterior)
 * O: Oclusal (em pré-molares/molares) ou Incisal (em incisivos/caninos)
 * V: Vestibular (voltada para os lábios/bochechas)
 * L: Lingual (mandíbula) ou Palatina (maxila)
 * GENERAL: Condição que afeta o dente como um todo (ex: implante, coroa, ausente)
 */
export type ToothSurface = 'MESIAL' | 'DISTAL' | 'OCCLUSAL_INCISAL' | 'VESTIBULAR' | 'LINGUAL_PALATAL' | 'GENERAL_TOOTH';

/**
 * Condições Clínicas e Patologias Suportadas
 */
export type DentalCondition =
  | 'HEALTHY'              // Hígido / Sem alterações
  | 'CARIES'               // Cárie ativa (vermelho)
  | 'RESTORATION_RESIN'    // Restauração em resina composta (azul)
  | 'RESTORATION_AMALGAM'  // Restauração em amálgama (grafite)
  | 'CROWN'                // Coroa / Prótese fixa unitária
  | 'PROSTHESIS_FIXED'     // Prótese fixa (pôntico)
  | 'PROSTHESIS_REMOVABLE' // Prótese parcial removível
  | 'ENDODONTIC_TREATED'   // Canal tratado / obturado
  | 'ENDODONTIC_NEEDED'    // Tratamento de canal indicado
  | 'IMPLANT'              // Implante osseointegrado
  | 'MISSING_TOOTH'        // Dente ausente / extraído
  | 'EXTRACTION_INDICATED' // Exodontia indicada
  | 'SEALANT'              // Selante de fóssulas e fissuras
  | 'FRACTURE'             // Fratura coronária/radicular
  | 'EROSION';             // Erosão / Abrasão / Abfração

/**
 * Camadas de Visualização Clínica
 */
export type ConditionLayer =
  | 'INITIAL_STATE'   // Achados pré-existentes diagnosticados na primeira consulta
  | 'TREATMENT_PLAN'  // Procedimentos propostos / orçados
  | 'COMPLETED';      // Procedimentos executados na clínica

/**
 * Dentição Permanente (ISO 3950):
 * Quadrante 1 (Superior Direito): 18, 17, 16, 15, 14, 13, 12, 11
 * Quadrante 2 (Superior Esquerdo): 21, 22, 23, 24, 25, 26, 27, 28
 * Quadrante 3 (Inferior Esquerdo): 31, 32, 33, 34, 35, 36, 37, 38
 * Quadrante 4 (Inferior Direito): 48, 47, 46, 45, 44, 43, 42, 41
 */
export const PERMANENT_TEETH_UPPER = [
  18, 17, 16, 15, 14, 13, 12, 11, // Q1
  21, 22, 23, 24, 25, 26, 27, 28  // Q2
] as const;

export const PERMANENT_TEETH_LOWER = [
  48, 47, 46, 45, 44, 43, 42, 41, // Q4
  31, 32, 33, 34, 35, 36, 37, 38  // Q3
] as const;

/**
 * Dentição Decídua (Infantil):
 * Quadrante 5 (Superior Direito): 55, 54, 53, 52, 51
 * Quadrante 6 (Superior Esquerdo): 61, 62, 63, 64, 65
 * Quadrante 7 (Inferior Esquerdo): 71, 72, 73, 74, 75
 * Quadrante 8 (Inferior Direito): 85, 84, 83, 82, 81
 */
export const DECIDUOUS_TEETH_UPPER = [
  55, 54, 53, 52, 51, // Q5
  61, 62, 63, 64, 65  // Q6
] as const;

export const DECIDUOUS_TEETH_LOWER = [
  85, 84, 83, 82, 81, // Q8
  71, 72, 73, 74, 75  // Q7
] as const;

export type PermanentToothNumber = (typeof PERMANENT_TEETH_UPPER)[number] | (typeof PERMANENT_TEETH_LOWER)[number];
export type DeciduousToothNumber = (typeof DECIDUOUS_TEETH_UPPER)[number] | (typeof DECIDUOUS_TEETH_LOWER)[number];
export type ToothNumber = PermanentToothNumber | DeciduousToothNumber;

/**
 * Registro de Diagnóstico/Procedimento em uma face ou dente
 */
export interface ToothFinding {
  id: string;
  toothNumber: ToothNumber;
  surface: ToothSurface;
  condition: DentalCondition;
  layer: ConditionLayer;
  notes?: string;
  suggestedProcedureId?: string;
  procedureName?: string;
  estimatedCostCents?: number;
  createdAt: string;
}

/**
 * Estado Normalizado do Odontograma em Memória / API
 */
export interface ToothState {
  toothNumber: ToothNumber;
  generalCondition?: ToothFinding; // Afeta todo o dente (ex: Implante, Ausente, Coroa)
  surfaces: {
    MESIAL?: ToothFinding;
    DISTAL?: ToothFinding;
    OCCLUSAL_INCISAL?: ToothFinding;
    VESTIBULAR?: ToothFinding;
    LINGUAL_PALATAL?: ToothFinding;
  };
}

export interface OdontogramData {
  patientId: string;
  versionNumber: number;
  title: string;
  activeLayer: ConditionLayer;
  findings: ToothFinding[];
  notes?: string;
  updatedAt: string;
}

/**
 * Metadados Visuais de Cada Condição (Cores canônicas de prontuário odontológico)
 */
export interface ConditionMetadata {
  code: DentalCondition;
  label: string;
  colorHex: string;
  category: 'SURFACE' | 'TOOTH' | 'BOTH';
  badgeStyle: string;
  description: string;
}

export const DENTAL_CONDITIONS_META: Record<DentalCondition, ConditionMetadata> = {
  HEALTHY: {
    code: 'HEALTHY',
    label: 'Hígido (Limpar)',
    colorHex: '#FFFFFF',
    category: 'BOTH',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Dente íntegro ou remoção de condição'
  },
  CARIES: {
    code: 'CARIES',
    label: 'Cárie Ativa',
    colorHex: '#EF4444', // Vermelho canônico de alerta
    category: 'SURFACE',
    badgeStyle: 'bg-red-500 text-white border-red-600',
    description: 'Lesão cariosa ativa necessitando intervenção'
  },
  RESTORATION_RESIN: {
    code: 'RESTORATION_RESIN',
    label: 'Restauração Resina',
    colorHex: '#3B82F6', // Azul canônico
    category: 'SURFACE',
    badgeStyle: 'bg-blue-500 text-white border-blue-600',
    description: 'Restauração direta em compósito'
  },
  RESTORATION_AMALGAM: {
    code: 'RESTORATION_AMALGAM',
    label: 'Restauração Amálgama',
    colorHex: '#4B5563', // Grafite metálico
    category: 'SURFACE',
    badgeStyle: 'bg-gray-600 text-white border-gray-700',
    description: 'Restauração em amálgama de prata'
  },
  SEALANT: {
    code: 'SEALANT',
    label: 'Selante',
    colorHex: '#10B981', // Verde esmeralda
    category: 'SURFACE',
    badgeStyle: 'bg-emerald-500 text-white border-emerald-600',
    description: 'Selamento de fóssulas e fissuras preventivo'
  },
  CROWN: {
    code: 'CROWN',
    label: 'Prótese Fixa / Coroa',
    colorHex: '#F59E0B', // Dourado
    category: 'TOOTH',
    badgeStyle: 'bg-amber-500 text-white border-amber-600',
    description: 'Coroa protética cimentada'
  },
  PROSTHESIS_FIXED: {
    code: 'PROSTHESIS_FIXED',
    label: 'Pôntico de Prótese',
    colorHex: '#D97706',
    category: 'TOOTH',
    badgeStyle: 'bg-amber-600 text-white border-amber-700',
    description: 'Elemento suspenso de prótese fixa'
  },
  PROSTHESIS_REMOVABLE: {
    code: 'PROSTHESIS_REMOVABLE',
    label: 'Prótese Removível',
    colorHex: '#8B5CF6',
    category: 'TOOTH',
    badgeStyle: 'bg-purple-500 text-white border-purple-600',
    description: 'Apoiado em prótese parcial removível'
  },
  ENDODONTIC_TREATED: {
    code: 'ENDODONTIC_TREATED',
    label: 'Canal Tratado',
    colorHex: '#06B6D4', // Ciano
    category: 'TOOTH',
    badgeStyle: 'bg-cyan-500 text-white border-cyan-600',
    description: 'Endodontia obturada satisfatoriamente'
  },
  ENDODONTIC_NEEDED: {
    code: 'ENDODONTIC_NEEDED',
    label: 'Canal Indicado',
    colorHex: '#EC4899', // Rosa escuro
    category: 'TOOTH',
    badgeStyle: 'bg-pink-500 text-white border-pink-600',
    description: 'Necessidade de tratamento endodôntico'
  },
  IMPLANT: {
    code: 'IMPLANT',
    label: 'Implante Dentário',
    colorHex: '#6366F1', // Índigo titânio
    category: 'TOOTH',
    badgeStyle: 'bg-indigo-500 text-white border-indigo-600',
    description: 'Implante osteointegrado instalado'
  },
  MISSING_TOOTH: {
    code: 'MISSING_TOOTH',
    label: 'Dente Ausente',
    colorHex: '#94A3B8', // Cinza 'X'
    category: 'TOOTH',
    badgeStyle: 'bg-slate-400 text-white border-slate-500',
    description: 'Ausência dentária congênita ou exodontia prévia'
  },
  EXTRACTION_INDICATED: {
    code: 'EXTRACTION_INDICATED',
    label: 'Exodontia Indicada',
    colorHex: '#DC2626', // Vermelho escuro 'X'
    category: 'TOOTH',
    badgeStyle: 'bg-red-600 text-white border-red-700',
    description: 'Indicação de extração cirúrgica'
  },
  FRACTURE: {
    code: 'FRACTURE',
    label: 'Fratura Dentária',
    colorHex: '#EA580C',
    category: 'BOTH',
    badgeStyle: 'bg-orange-600 text-white border-orange-700',
    description: 'Fratura dental ou trinca visível'
  },
  EROSION: {
    code: 'EROSION',
    label: 'Erosão / Desgaste',
    colorHex: '#CA8A04',
    category: 'BOTH',
    badgeStyle: 'bg-yellow-600 text-white border-yellow-700',
    description: 'Desgaste por atrição, abrasão ou abfração'
  }
};
