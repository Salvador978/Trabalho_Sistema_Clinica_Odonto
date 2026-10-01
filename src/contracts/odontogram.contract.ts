/**
 * CONTRATOS DE API & DTOs: ODONTOGRAMA & PRONTUÁRIO
 * Gerencia Odonto SaaS
 */

import {
  ToothNumber,
  ToothSurface,
  DentalCondition,
  ConditionLayer,
  ToothFinding,
  OdontogramData
} from '../types/odontogram';

export interface SaveOdontogramFindingDTO {
  toothNumber: ToothNumber;
  surface: ToothSurface;
  condition: DentalCondition;
  layer: ConditionLayer;
  notes?: string;
  suggestedProcedureId?: string;
  estimatedCostCents?: number;
}

export interface SaveOdontogramVersionDTO {
  patientId: string;
  title: string;
  notes?: string;
  findings: SaveOdontogramFindingDTO[];
  generateBudgetDraft?: boolean; // Cria rascunho de orçamento a partir dos procedimentos propostos
}

export interface OdontogramVersionSummaryResponse {
  id: string;
  versionNumber: number;
  title: string;
  createdAt: string;
  createdByDentist: {
    id: string;
    name: string;
    cro: string;
  };
  totalFindingsCount: number;
  activeCariesCount: number;
  plannedProceduresCount: number;
  isActive: boolean;
}

export interface OdontogramFullResponse {
  id: string;
  patientId: string;
  patientName: string;
  versionNumber: number;
  title: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  data: OdontogramData;
  availableVersions: OdontogramVersionSummaryResponse[];
}
