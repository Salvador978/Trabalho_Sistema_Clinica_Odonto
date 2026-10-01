import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  ToothNumber,
  ToothSurface,
  DentalCondition,
  ConditionLayer,
  ToothFinding,
  OdontogramData
} from '../types/odontogram';

export interface OdontogramStoreState {
  patientId: string;
  versionNumber: number;
  title: string;
  activeLayer: ConditionLayer;
  selectedCondition: DentalCondition;
  dentitionMode: 'PERMANENT' | 'DECIDUOUS' | 'MIXED';
  selectedTooth: ToothNumber | null;
  findings: ToothFinding[];
  history: ToothFinding[][]; // Para Undo/Redo
  historyIndex: number;
}

export function useOdontogram(initialPatientId: string = 'paciente-demo-01', initialData?: OdontogramData) {
  const [patientId, setPatientId] = useState<string>(initialData?.patientId || initialPatientId);
  const [versionNumber, setVersionNumber] = useState<number>(initialData?.versionNumber || 1);
  const [title, setTitle] = useState<string>(initialData?.title || 'Odontograma Geral');
  const [activeLayer, setActiveLayer] = useState<ConditionLayer>(initialData?.activeLayer || 'TREATMENT_PLAN');
  const [selectedCondition, setSelectedCondition] = useState<DentalCondition>('CARIES');
  const [dentitionMode, setDentitionMode] = useState<'PERMANENT' | 'DECIDUOUS' | 'MIXED'>('PERMANENT');
  const [selectedTooth, setSelectedTooth] = useState<ToothNumber | null>(null);

  // Histórico de alterações para Undo/Redo
  const [findingsHistory, setFindingsHistory] = useState<ToothFinding[][]>([
    initialData?.findings || []
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Sincroniza patientId quando alterado externamente
  useEffect(() => {
    if (initialPatientId && initialPatientId !== patientId) {
      setPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Carrega odontograma salvo do backend para o paciente caso não haja initialData
  useEffect(() => {
    let active = true;
    if (initialData?.findings) {
      setFindingsHistory([initialData.findings]);
      setHistoryIndex(0);
    } else if (patientId) {
      api.clinical.getOdontogram(patientId)
        .then((res) => {
          if (active && res?.findings && Array.isArray(res.findings) && res.findings.length > 0) {
            setFindingsHistory([res.findings]);
            setHistoryIndex(0);
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [patientId, initialData]);

  const findings = findingsHistory[historyIndex] || [];

  // Registrar novo estado no histórico
  const pushState = useCallback((newFindings: ToothFinding[]) => {
    setFindingsHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newFindings];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Aplicar condição a uma face específica
  const applyConditionToSurface = useCallback((
    toothNumber: ToothNumber,
    surface: ToothSurface,
    conditionToApply: DentalCondition = selectedCondition
  ) => {
    let currentFindings = [...findings];

    if (conditionToApply === 'HEALTHY') {
      // Remove achados dessa face na camada ativa
      currentFindings = currentFindings.filter(
        (f) => !(f.toothNumber === toothNumber && f.surface === surface && f.layer === activeLayer)
      );
    } else {
      // Remove condição anterior na mesma face e camada se existir
      currentFindings = currentFindings.filter(
        (f) => !(f.toothNumber === toothNumber && f.surface === surface && f.layer === activeLayer)
      );

      const newFinding: ToothFinding = {
        id: `fnd_${crypto.randomUUID()}`,
        toothNumber,
        surface,
        condition: conditionToApply,
        layer: activeLayer,
        createdAt: new Date().toISOString()
      };

      currentFindings.push(newFinding);
    }

    pushState(currentFindings);
  }, [findings, selectedCondition, activeLayer, pushState]);

  // Aplicar condição ao dente inteiro (Whole-Tooth: Implante, Coroa, Ausente, Extração, Canal, etc.)
  const applyConditionToWholeTooth = useCallback((
    toothNumber: ToothNumber,
    conditionToApply: DentalCondition = selectedCondition
  ) => {
    let currentFindings = [...findings];

    if (conditionToApply === 'HEALTHY') {
      // Limpa todas as condições do dente nesta camada (dente todo e faces)
      currentFindings = currentFindings.filter(
        (f) => !(f.toothNumber === toothNumber && f.layer === activeLayer)
      );
    } else {
      // Para condições de dente todo (Coroa, Implante, Ausente, Extração), limpa marcas prévias do dente nessa camada
      if (['MISSING_TOOTH', 'EXTRACTION_INDICATED', 'IMPLANT', 'CROWN', 'PROSTHESIS_FIXED'].includes(conditionToApply)) {
        currentFindings = currentFindings.filter(
          (f) => !(f.toothNumber === toothNumber && f.layer === activeLayer)
        );
      } else {
        // Remove apenas condição de dente inteiro prévia nessa camada
        currentFindings = currentFindings.filter(
          (f) => !(f.toothNumber === toothNumber && f.surface === 'GENERAL_TOOTH' && f.layer === activeLayer)
        );
      }

      const newFinding: ToothFinding = {
        id: `fnd_${crypto.randomUUID()}`,
        toothNumber,
        surface: 'GENERAL_TOOTH',
        condition: conditionToApply,
        layer: activeLayer,
        createdAt: new Date().toISOString()
      };

      currentFindings.push(newFinding);
    }

    pushState(currentFindings);
  }, [findings, selectedCondition, activeLayer, pushState]);

  // Desfazer (Undo)
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex]);

  // Refazer (Redo)
  const redo = useCallback(() => {
    if (historyIndex < findingsHistory.length - 1) {
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, findingsHistory.length]);

  // Limpar camada ativa
  const clearActiveLayer = useCallback(() => {
    const remaining = findings.filter((f) => f.layer !== activeLayer);
    pushState(remaining);
  }, [findings, activeLayer, pushState]);

  // Indexar achados por dente para renderização O(1) de alta performance
  const findingsByTooth = useMemo(() => {
    const map = new Map<ToothNumber, {
      initial: ToothFinding[];
      treatment: ToothFinding[];
      completed: ToothFinding[];
    }>();

    findings.forEach((finding) => {
      if (!map.has(finding.toothNumber)) {
        map.set(finding.toothNumber, { initial: [], treatment: [], completed: [] });
      }
      const entry = map.get(finding.toothNumber)!;
      if (finding.layer === 'INITIAL_STATE') entry.initial.push(finding);
      else if (finding.layer === 'TREATMENT_PLAN') entry.treatment.push(finding);
      else if (finding.layer === 'COMPLETED') entry.completed.push(finding);
    });

    return map;
  }, [findings]);

  // Exportar JSON estruturado pronto para a API REST
  const exportPayload = useCallback((): OdontogramData => {
    return {
      patientId,
      versionNumber,
      title,
      activeLayer,
      findings,
      updatedAt: new Date().toISOString()
    };
  }, [patientId, versionNumber, title, activeLayer, findings]);

  return {
    patientId,
    versionNumber,
    setVersionNumber,
    title,
    setTitle,
    activeLayer,
    setActiveLayer,
    selectedCondition,
    setSelectedCondition,
    dentitionMode,
    setDentitionMode,
    selectedTooth,
    setSelectedTooth,
    findings,
    findingsByTooth,
    applyConditionToSurface,
    applyConditionToWholeTooth,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < findingsHistory.length - 1,
    clearActiveLayer,
    exportPayload
  };
}

/**
 * Hook de salvamento automático do Odontograma com debounce de 1500ms
 */
export function useAutoSaveOdontogram(
  patientId: string,
  teethState: any,
  layer: string,
  enabled: boolean = true
) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isFirstRender = useRef(true);
  const prevPatientId = useRef(patientId);

  useEffect(() => {
    if (prevPatientId.current !== patientId) {
      prevPatientId.current = patientId;
      isFirstRender.current = true;
      setSaveStatus('saved');
      return;
    }

    // Evita salvar no primeiro carregamento da tela
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    setSaveStatus('saving');

    // Debounce de 1500ms (aguarda 1.5s após a última alteração do dentista)
    const timeoutId = setTimeout(async () => {
      try {
        await api.clinical.saveOdontogram({
          patientId,
          layer,
          teeth: teethState,
          updatedAt: new Date().toISOString()
        });
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } catch (err) {
        console.error('Falha no salvamento automático:', err);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [teethState, layer, patientId, enabled]);

  return { saveStatus, lastSavedAt };
}

