import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Contrast,
  RotateCw
} from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../../services/storage';

export interface RadiographItem {
  id: string;
  patientId: string;
  date: string;
  category: 'PERIAPICAL' | 'PANORAMIC' | 'BITEWING' | 'PHOTO_PRE' | 'PHOTO_POST' | 'OTHER';
  toothRegion: string;
  notes?: string;
  imageUrl: string;
}

interface RadiographyGalleryProps {
  patientId: string;
  patientName: string;
  isReadOnly?: boolean;
}

const DEFAULT_SAMPLE_IMAGES: RadiographItem[] = [];

export const RadiographyGallery: React.FC<RadiographyGalleryProps> = ({
  patientId,
  patientName,
  isReadOnly = false
}) => {
  const [items, setItems] = useState<RadiographItem[]>(() => {
    const stored = loadFromStorage<RadiographItem[]>('RADIOGRAPHS' as any, []);
    // Remove any legacy mock photos from external URLs (Unsplash) or sample IDs to keep project ultra-light
    const cleanStored = (stored || []).filter(
      (item) => !item.id.startsWith('rad_1') && !item.id.startsWith('rad_2') && !item.imageUrl?.includes('unsplash.com')
    );
    if (cleanStored.length !== (stored || []).length) {
      saveToStorage('RADIOGRAPHS' as any, cleanStored);
    }
    return cleanStored.filter((item) => item.patientId === patientId);
  });

  const [activeItem, setActiveItem] = useState<RadiographItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isInverted, setIsInverted] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Formulário de novo anexo
  const [category, setCategory] = useState<RadiographItem['category']>('PERIAPICAL');
  const [toothRegion, setToothRegion] = useState('Elemento 16');
  const [notes, setNotes] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');

  useEffect(() => {
    const allStored = loadFromStorage<RadiographItem[]>('RADIOGRAPHS' as any, []);
    const cleanStored = (allStored || []).filter(
      (item) => !item.id.startsWith('rad_1') && !item.id.startsWith('rad_2') && !item.imageUrl?.includes('unsplash.com')
    );
    const otherPatients = cleanStored.filter((item) => item.patientId !== patientId);
    saveToStorage('RADIOGRAPHS' as any, [...otherPatients, ...items]);
  }, [items, patientId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedUrl) {
      alert('Selecione ou anexe uma imagem para upload.');
      return;
    }

    const newItem: RadiographItem = {
      id: `rad_${Date.now()}`,
      patientId,
      date: new Date().toLocaleDateString('pt-BR'),
      category,
      toothRegion,
      notes: notes.trim() || undefined,
      imageUrl: uploadedUrl
    };

    setItems([newItem, ...items]);
    setUploadedUrl('');
    setNotes('');
    setIsUploadModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover esta radiografia/foto do prontuário?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (activeItem?.id === id) setActiveItem(null);
    }
  };

  const categoryLabels: Record<RadiographItem['category'], string> = {
    PERIAPICAL: 'Periapical (Raio-X)',
    PANORAMIC: 'Panorâmica',
    BITEWING: 'Interproximal (Bite-wing)',
    PHOTO_PRE: 'Foto Intraoral (Pré-Op)',
    PHOTO_POST: 'Foto Intraoral (Pós-Op)',
    OTHER: 'Tomografia / Documento'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* HEADER DO MÓDULO RADIOGRÁFICO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Galeria Radiográfica & Fotos Intraorais
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Exames por imagem e registros clínicos de {patientName} (Negatoscópio digital)
          </p>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Anexar Radiografia / Foto
          </button>
        )}
      </div>

      {/* GRADE DE IMAGENS MINIATURA */}
      {items.length === 0 ? (
        <div className="py-10 px-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-slate-700">
              Nenhuma imagem anexada
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              A galeria está vazia para garantir leveza e velocidade total de carregamento. Anexe fotografias ou radiografias sempre que realizar exames com o paciente.
            </p>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-1 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Anexar Primeiro Exame / Foto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setActiveItem(item);
                setZoomLevel(1);
                setIsInverted(false);
              }}
              className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:scale-[1.02]"
            >
              <div className="aspect-4/3 overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={item.imageUrl}
                  alt={item.toothRegion}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
              </div>

              <div className="p-2 bg-white border-t border-slate-100 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {item.toothRegion}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.date}
                  </span>
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold block truncate">
                  {categoryLabels[item.category]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX / NEGATOSCÓPIO DIGITAL (VISUALIZADOR AVANÇADO) */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header do Lightbox */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🦷</span> {activeItem.toothRegion} - {categoryLabels[activeItem.category]}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Data do Exame: {activeItem.date} | Paciente: {patientName}
                </p>
              </div>

              {/* Controles de Imagem (Zoom & Inversão de Contraste) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInverted(!isInverted)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    isInverted ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Inverter cores (Modo Negatoscópio de alto contraste para ápices radiculares)"
                >
                  <Contrast className="w-3.5 h-3.5" />
                  Inverter P/B
                </button>

                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                    className="p-1 text-slate-300 hover:text-white cursor-pointer"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold px-2 text-blue-400">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    className="p-1 text-slate-300 hover:text-white cursor-pointer"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(activeItem.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Remover esta imagem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Imagem Centralizada com Zoom e Filtro */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black min-h-[350px]">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.toothRegion}
                style={{
                  transform: `scale(${zoomLevel})`,
                  filter: isInverted ? 'invert(1) contrast(1.4)' : 'none',
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Anotações Clínicas */}
            {activeItem.notes && (
              <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-blue-400 block mb-0.5">Laudo / Observações Clínicas:</span>
                {activeItem.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE UPLOAD DE NOVA RADIOGRAFIA / FOTO */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Anexar Radiografia ou Fotografia Clínica
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Arquivo de Imagem (PNG, JPG ou DICOM exportado)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-600 border border-slate-300 rounded-xl p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo do Exame
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PERIAPICAL">Periapical (Raio-X)</option>
                    <option value="PANORAMIC">Panorâmica</option>
                    <option value="BITEWING">Interproximal (Bite-wing)</option>
                    <option value="PHOTO_PRE">Foto Intraoral (Pré-Op)</option>
                    <option value="PHOTO_POST">Foto Intraoral (Pós-Op)</option>
                    <option value="OTHER">Tomografia / Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dente ou Região
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Elemento 16, Molar"
                    value={toothRegion}
                    onChange={(e) => setToothRegion(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações Clínicas / Laudo Radiográfico
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Presença de lesão periapical circunscrita..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Salvar no Prontuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
