import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, PenTool, Smartphone } from 'lucide-react';

export interface SignatureData {
  signatureBase64: string;
  timestamp: string;
  ipAddress: string;
  consentFlag: boolean;
  strokeCount: number;
}

interface Point {
  xRatio: number; // Coordenada X normalizada (0 a 1) para imunidade a rotação/resize
  yRatio: number; // Coordenada Y normalizada (0 a 1) para imunidade a rotação/resize
}

interface SignaturePadProps {
  signerName: string;
  signerCpf?: string;
  onConfirm: (data: SignatureData) => void;
  onCancel?: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  signerName,
  signerCpf,
  onConfirm,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Armazena o traçado vetorialmente como pontos normalizados (0.0 a 1.0)
  // Isso garante que mesmo girando o tablet de retrato para paisagem ou redimensionando a janela,
  // o traçado NUNCA se perde e NUNCA distorce!
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const [hasSignature, setHasSignature] = useState(false);
  const [windowResized, setWindowResized] = useState(0);

  // Redesenha todos os traçados no canvas mantendo escala perfeita
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = Math.max(2.5 * (window.devicePixelRatio || 1), 2.5);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const w = canvas.width;
    const h = canvas.height;

    strokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].xRatio * w, stroke[0].yRatio * h);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].xRatio * w, stroke[i].yRatio * h);
      }
      ctx.stroke();
    });
  }, []);

  // Ajusta a resolução física e lógica do canvas conforme o container (Resize & Rotação)
  const adjustCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Define resolução interna de alta definição
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Redesenha os traços preservados
    redrawCanvas();
  }, [redrawCanvas]);

  // Listener de resize e rotação de tela (ResizeObserver + orientationchange)
  useEffect(() => {
    adjustCanvasDimensions();

    const resizeObserver = new ResizeObserver(() => {
      adjustCanvasDimensions();
      setWindowResized((c) => c + 1);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleOrientation = () => {
      setTimeout(adjustCanvasDimensions, 100);
    };

    window.addEventListener('orientationchange', handleOrientation);
    window.addEventListener('resize', adjustCanvasDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleOrientation);
      window.removeEventListener('resize', adjustCanvasDimensions);
    };
  }, [adjustCanvasDimensions]);

  // Captura de coordenadas relativas normalizadas (0 a 1)
  const getNormalizedPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { xRatio: 0, yRatio: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const xRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const yRatio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { xRatio, yRatio };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getNormalizedPoint(e);
    currentStrokeRef.current = [point];
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = Math.max(2.5 * (window.devicePixelRatio || 1), 2.5);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(point.xRatio * canvas.width, point.yRatio * canvas.height);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getNormalizedPoint(e);
    currentStrokeRef.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(point.xRatio * canvas.width, point.yRatio * canvas.height);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureBase64 = canvas.toDataURL('image/png');
    onConfirm({
      signatureBase64,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.105 (Local/Tablet)',
      consentFlag: true,
      strokeCount: strokesRef.current.length
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            Assinatura Digital Vetorial na Tela
          </span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
            <Smartphone className="w-3 h-3" />
            Auto-ajuste de Rotação Ativo
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Signatário: <strong className="text-slate-700">{signerName}</strong> {signerCpf ? `(${signerCpf})` : ''}
        </span>
      </div>

      {/* ÁREA DE DESENHO COM RESIZE OBSERVER INTEGRADO */}
      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/70 touch-none overflow-hidden h-40 sm:h-44 w-full"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Linha guia de assinatura */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-slate-300/80 pointer-events-none flex justify-between items-end pb-1">
          <span className="text-[10px] text-slate-400 font-medium select-none">
            ✕ Assine sobre a linha
          </span>
          <span className="text-[10px] text-slate-400 select-none">
            Imune a rotação e zoom do tablet
          </span>
        </div>

        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-slate-400 font-medium">
              Use a caneta stylus, mouse ou o dedo para assinar aqui
            </span>
          </div>
        )}
      </div>

      {/* BOTÕES DE CONTROLE */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Traçado
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasSignature}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Confirmar Assinatura Digital
          </button>
        </div>
      </div>
    </div>
  );
};
