import React from 'react';
import {
  ToothNumber,
  ToothSurface,
  DentalCondition,
  ConditionLayer,
  ToothFinding,
  DENTAL_CONDITIONS_META
} from '../../types/odontogram';

interface ToothSvgProps {
  toothNumber: ToothNumber;
  activeLayer: ConditionLayer;
  initialFindings: ToothFinding[];
  treatmentFindings: ToothFinding[];
  completedFindings: ToothFinding[];
  onSurfaceClick: (toothNumber: ToothNumber, surface: ToothSurface) => void;
  onToothClick: (toothNumber: ToothNumber) => void;
  isSelected?: boolean;
  isWholeToothActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ToothSvg: React.FC<ToothSvgProps> = ({
  toothNumber,
  activeLayer,
  initialFindings,
  treatmentFindings,
  completedFindings,
  onSurfaceClick,
  onToothClick,
  isSelected = false,
  isWholeToothActive = false,
  size = 'md'
}) => {
  // Identifica se o dente é superior ou inferior
  const isUpper =
    (toothNumber >= 11 && toothNumber <= 28) ||
    (toothNumber >= 51 && toothNumber <= 65);

  // Identifica o quadrante para posicionar Mesial vs Distal corretamente
  // Quadrantes Direitos do Paciente (Q1, Q4, Q5, Q8): Linha média fica à DIREITA -> Mesial é Direita, Distal é Esquerda
  // Quadrantes Esquerdos do Paciente (Q2, Q3, Q6, Q7): Linha média fica à ESQUERDA -> Mesial é Esquerda, Distal é Direita
  const isRightSideOfPatient =
    (toothNumber >= 11 && toothNumber <= 18) ||
    (toothNumber >= 41 && toothNumber <= 48) ||
    (toothNumber >= 51 && toothNumber <= 55) ||
    (toothNumber >= 81 && toothNumber <= 85);

  const leftSurface: ToothSurface = isRightSideOfPatient ? 'DISTAL' : 'MESIAL';
  const rightSurface: ToothSurface = isRightSideOfPatient ? 'MESIAL' : 'DISTAL';
  const topSurface: ToothSurface = isUpper ? 'VESTIBULAR' : 'LINGUAL_PALATAL';
  const bottomSurface: ToothSurface = isUpper ? 'LINGUAL_PALATAL' : 'VESTIBULAR';
  const centerSurface: ToothSurface = 'OCCLUSAL_INCISAL';

  // Coleta os achados da camada ativa (com fallback visual suave se visualizando plano de tratamento)
  const currentFindings =
    activeLayer === 'TREATMENT_PLAN'
      ? treatmentFindings
      : activeLayer === 'INITIAL_STATE'
      ? initialFindings
      : completedFindings;

  // Encontrar condição de dente inteiro (Geral)
  const generalFinding = currentFindings.find((f) => f.surface === 'GENERAL_TOOTH');

  // Helper para obter a cor de preenchimento de uma face específica
  const getSurfaceFill = (surface: ToothSurface): string => {
    // 1. Se o dente tem uma condição de dente todo (GENERAL_TOOTH), preenche todas as faces harmonicamente
    if (generalFinding) {
      if (generalFinding.condition === 'CROWN' || generalFinding.condition === 'PROSTHESIS_FIXED') {
        return '#FEF3C7'; // Âmbar suave (ouro / coroa em todo o dente)
      }
      if (generalFinding.condition === 'IMPLANT') {
        return '#EEF2FF'; // Índigo suave de implante
      }
      if (generalFinding.condition === 'MISSING_TOOTH') {
        return '#F1F5F9'; // Cinza dente ausente
      }
      if (generalFinding.condition === 'EXTRACTION_INDICATED') {
        return '#FEF2F2'; // Vermelho translúcido de extração indicada
      }
      if (generalFinding.condition === 'ENDODONTIC_TREATED') {
        return '#ECFEFF'; // Ciano suave de endodontia tratada
      }
      if (generalFinding.condition === 'ENDODONTIC_NEEDED') {
        return '#FDF2F8'; // Rosa suave de canal indicado
      }
    }

    const finding = currentFindings.find((f) => f.surface === surface);
    if (finding) {
      return DENTAL_CONDITIONS_META[finding.condition].colorHex;
    }
    // Se estiver no plano de tratamento e não tiver procedimento, verifica se tem cárie no estado inicial para alertar
    if (activeLayer === 'TREATMENT_PLAN') {
      const initialFinding = initialFindings.find((f) => f.surface === surface);
      if (initialFinding && initialFinding.condition === 'CARIES') {
        return '#FEE2E2'; // Fundo vermelho bem claro indicando necessidade prévia
      }
    }
    return '#F8FAFC'; // Hígido (Branco/Slate claro)
  };

  // Helper para labels de acessibilidade/tooltip
  const getSurfaceLabel = (surface: ToothSurface): string => {
    const names: Record<ToothSurface, string> = {
      MESIAL: 'Mesial (M)',
      DISTAL: 'Distal (D)',
      OCCLUSAL_INCISAL: isUpper && [11, 12, 13, 21, 22, 23, 51, 52, 53, 61, 62, 63].includes(toothNumber) ? 'Incisal (I)' : 'Oclusal (O)',
      VESTIBULAR: 'Vestibular (V)',
      LINGUAL_PALATAL: isUpper ? 'Palatina (P)' : 'Lingual (L)',
      GENERAL_TOOTH: 'Dente Completo'
    };
    const finding = currentFindings.find((f) => f.surface === surface);
    return `${names[surface]}${finding ? ` - ${DENTAL_CONDITIONS_META[finding.condition].label}` : ''}`;
  };

  return (
    <div
      onClick={isWholeToothActive ? () => onSurfaceClick(toothNumber, 'GENERAL_TOOTH') : undefined}
      className={`relative flex flex-col items-center p-0.5 sm:p-1 rounded-xl transition-all duration-150 select-none group shrink-0 ${
        isSelected
          ? 'bg-blue-50 ring-2 ring-blue-500 shadow-md scale-105 z-10'
          : isWholeToothActive
          ? 'cursor-pointer hover:bg-blue-50/80 hover:ring-2 hover:ring-blue-400 hover:shadow-xs hover:scale-105'
          : 'hover:bg-slate-50 hover:shadow-2xs'
      }`}
      title={isWholeToothActive ? `Dente ${toothNumber} (FDI) - Clique para selecionar o dente todo` : undefined}
    >
      {/* Indicador Numérico do Dente (Sistema FDI ISO 3950) */}
      <button
        type="button"
        onClick={() => onToothClick(toothNumber)}
        className={`mb-1 text-[10px] sm:text-[11px] font-bold transition-colors px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer ${
          isWholeToothActive
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            : 'text-slate-700 hover:text-blue-600 bg-slate-100 group-hover:bg-blue-100'
        }`}
        title={`Dente ${toothNumber} (FDI) - Clique para ações gerais`}
      >
        <span>{toothNumber}</span>
        {generalFinding && (
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: DENTAL_CONDITIONS_META[generalFinding.condition].colorHex }}
          />
        )}
      </button>

      {/* SVG Interativo Anatômico */}
      <div
        className={`relative ${
          size === 'lg'
            ? 'w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20'
            : size === 'sm'
            ? 'w-7 h-7 sm:w-8 sm:h-8'
            : 'w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12'
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-2xs transition-transform duration-200"
        >
          {/* Contorno base e fundo */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="16"
            fill="#FFFFFF"
            stroke={isWholeToothActive ? '#60A5FA' : '#CBD5E1'}
            strokeWidth={isWholeToothActive ? '2.5' : '2'}
          />

          {/* FACE SUPERIOR (Vestibular ou Lingual/Palatina dependendo da arcada) */}
          <polygon
            points="14,14 86,14 68,32 32,32"
            fill={getSurfaceFill(topSurface)}
            stroke="#94A3B8"
            strokeWidth="1.5"
            className={`cursor-pointer transition-colors duration-150 ${
              isWholeToothActive ? 'hover:fill-blue-200/60' : 'hover:fill-blue-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick(toothNumber, isWholeToothActive ? 'GENERAL_TOOTH' : topSurface);
            }}
          >
            <title>{`${toothNumber} - ${getSurfaceLabel(topSurface)}`}</title>
          </polygon>

          {/* FACE INFERIOR (Palatina ou Vestibular dependendo da arcada) */}
          <polygon
            points="32,68 68,68 86,86 14,86"
            fill={getSurfaceFill(bottomSurface)}
            stroke="#94A3B8"
            strokeWidth="1.5"
            className={`cursor-pointer transition-colors duration-150 ${
              isWholeToothActive ? 'hover:fill-blue-200/60' : 'hover:fill-blue-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick(toothNumber, isWholeToothActive ? 'GENERAL_TOOTH' : bottomSurface);
            }}
          >
            <title>{`${toothNumber} - ${getSurfaceLabel(bottomSurface)}`}</title>
          </polygon>

          {/* FACE ESQUERDA (Mesial ou Distal de acordo com o lado anatômico) */}
          <polygon
            points="14,14 32,32 32,68 14,86"
            fill={getSurfaceFill(leftSurface)}
            stroke="#94A3B8"
            strokeWidth="1.5"
            className={`cursor-pointer transition-colors duration-150 ${
              isWholeToothActive ? 'hover:fill-blue-200/60' : 'hover:fill-blue-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick(toothNumber, isWholeToothActive ? 'GENERAL_TOOTH' : leftSurface);
            }}
          >
            <title>{`${toothNumber} - ${getSurfaceLabel(leftSurface)}`}</title>
          </polygon>

          {/* FACE DIREITA (Distal ou Mesial de acordo com o lado anatômico) */}
          <polygon
            points="86,14 86,86 68,68 68,32"
            fill={getSurfaceFill(rightSurface)}
            stroke="#94A3B8"
            strokeWidth="1.5"
            className={`cursor-pointer transition-colors duration-150 ${
              isWholeToothActive ? 'hover:fill-blue-200/60' : 'hover:fill-blue-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick(toothNumber, isWholeToothActive ? 'GENERAL_TOOTH' : rightSurface);
            }}
          >
            <title>{`${toothNumber} - ${getSurfaceLabel(rightSurface)}`}</title>
          </polygon>

          {/* FACE CENTRAL (Oclusal em molares/pré-molares ou Incisal em anteriores) */}
          <polygon
            points="32,32 68,32 68,68 32,68"
            fill={getSurfaceFill(centerSurface)}
            stroke="#64748B"
            strokeWidth="2"
            className={`cursor-pointer transition-colors duration-150 ${
              isWholeToothActive ? 'hover:fill-blue-300/60' : 'hover:fill-blue-300'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick(toothNumber, isWholeToothActive ? 'GENERAL_TOOTH' : centerSurface);
            }}
          >
            <title>{`${toothNumber} - ${getSurfaceLabel(centerSurface)}`}</title>
          </polygon>

          {/* ============================================================== */}
          {/* OVERLAYS VISUAIS DE CONDIÇÕES DE DENTE INTEIRO                 */}
          {/* ============================================================== */}

          {/* 1. Dente Ausente: X em cinza escuro */}
          {generalFinding?.condition === 'MISSING_TOOTH' && (
            <g stroke="#475569" strokeWidth="5" strokeLinecap="round">
              <line x1="16" y1="16" x2="84" y2="84" />
              <line x1="84" y1="16" x2="16" y2="84" />
            </g>
          )}

          {/* 2. Extração Indicada: X em vermelho vibrante com tracejado */}
          {generalFinding?.condition === 'EXTRACTION_INDICATED' && (
            <g stroke="#DC2626" strokeWidth="6" strokeLinecap="round" strokeDasharray="10,4">
              <line x1="14" y1="14" x2="86" y2="86" />
              <line x1="86" y1="14" x2="14" y2="86" />
            </g>
          )}

          {/* 3. Implante Osseointegrado: Parafuso de Titânio Estilizado */}
          {generalFinding?.condition === 'IMPLANT' && (
            <g fill="#4F46E5" stroke="#312E81" strokeWidth="1.5">
              <rect x="42" y="16" width="16" height="68" rx="4" fill="#6366F1" opacity="0.9" />
              <line x1="38" y1="28" x2="62" y2="28" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="38" y1="40" x2="62" y2="40" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="38" y1="52" x2="62" y2="52" stroke="#FFFFFF" strokeWidth="2" />
              <line x1="38" y1="64" x2="62" y2="64" stroke="#FFFFFF" strokeWidth="2" />
              <polygon points="50,88 42,76 58,76" fill="#4338CA" />
            </g>
          )}

          {/* 4. Coroa Protética / Prótese Fixa: Borda Ouro e Brilho */}
          {(generalFinding?.condition === 'CROWN' || generalFinding?.condition === 'PROSTHESIS_FIXED') && (
            <rect
              x="6"
              y="6"
              width="88"
              height="88"
              rx="14"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="5"
              strokeDasharray={generalFinding.condition === 'PROSTHESIS_FIXED' ? '6,3' : 'none'}
            />
          )}

          {/* 5. Endodontia Tratada: Linha de Canal Obturada */}
          {generalFinding?.condition === 'ENDODONTIC_TREATED' && (
            <g stroke="#06B6D4" strokeWidth="4" strokeLinecap="round">
              <line x1="50" y1="10" x2="50" y2="90" />
              <circle cx="50" cy="50" r="6" fill="#0891B2" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {/* 6. Endodontia Indicada: Alerta Endodôntico */}
          {generalFinding?.condition === 'ENDODONTIC_NEEDED' && (
            <g stroke="#EC4899" strokeWidth="4" strokeLinecap="round" strokeDasharray="5,3">
              <line x1="50" y1="10" x2="50" y2="90" />
              <circle cx="50" cy="50" r="7" fill="#DB2777" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}
        </svg>

        {/* Marcador de orientação sutil de face Mesial para o dentista */}
        <span
          className={`absolute text-[8px] font-bold text-slate-400 select-none pointer-events-none ${
            isRightSideOfPatient ? 'right-0.5 top-1/2 -translate-y-1/2' : 'left-0.5 top-1/2 -translate-y-1/2'
          }`}
        >
          M
        </span>
      </div>

      {/* Rótulo Anatômico Reduzido */}
      <span className="mt-1 text-[10px] text-slate-500 font-medium">
        {isUpper ? (isRightSideOfPatient ? 'Q1' : 'Q2') : isRightSideOfPatient ? 'Q4' : 'Q3'}
      </span>
    </div>
  );
};
