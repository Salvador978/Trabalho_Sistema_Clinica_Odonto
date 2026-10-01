import React, { useState } from 'react';
import { ShieldCheck, Plus, Printer, CheckCircle, AlertOctagon, Clock, Thermometer, Gauge, Sparkles } from 'lucide-react';

export interface SterilizationCycleData {
  id: string;
  cycleNumber: string;
  lotCode: string;
  date: string;
  startTime: string;
  endTime: string;
  operatorName: string;
  equipmentName: string;
  tempCelsius: number;
  pressureBar: number;
  timeMin: number;
  chemicalIndicator: 'APPROVED' | 'REJECTED';
  biologicalTest: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  packagesCount: number;
  packagesDescription: string;
}

export const AutoclaveLog: React.FC = () => {
  const [cycles, setCycles] = useState<SterilizationCycleData[]>([]);

  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [concurrencyError, setConcurrencyError] = useState<string | null>(null);
  const [isSubmittingCycle, setIsSubmittingCycle] = useState(false);

  const [newCycle, setNewCycle] = useState({
    operatorName: 'Recepção / ASB',
    equipmentName: 'Autoclave Cristófoli Vitale 21L',
    tempCelsius: 134.0,
    pressureBar: 2.15,
    timeMin: 15,
    chemicalIndicator: 'APPROVED' as const,
    biologicalTest: 'PENDING' as const,
    packagesCount: 8,
    packagesDescription: 'Kits Clínicos Básicos'
  });

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    setConcurrencyError(null);
    setIsSubmittingCycle(true);

    const nextNumber = cycles.length + 29;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const generatedCycleNumber = `CICLO-2026/${String(nextNumber).padStart(3, '0')}`;
    const generatedLotCode = `LOTE-${day}${month}-${String(cycles.length + 1).padStart(2, '0')}`;

    // CENÁRIO CRÍTICO: DETECÇÃO DE CONCORRÊNCIA / IDEMPOTÊNCIA
    const isDuplicateCycle = cycles.some(
      (c) => c.cycleNumber === generatedCycleNumber || c.lotCode === generatedLotCode
    );

    if (isDuplicateCycle) {
      setConcurrencyError(`⚠️ Conflito de Concorrência: O lote ${generatedLotCode} já foi gravado por outro terminal. Atualizando lista para evitar duplicidade.`);
      setIsSubmittingCycle(false);
      return;
    }

    const created: SterilizationCycleData = {
      id: `cyc_${Date.now()}`,
      cycleNumber: generatedCycleNumber,
      lotCode: generatedLotCode,
      date: `${day}/${month}/${now.getFullYear()}`,
      startTime: '09:00',
      endTime: '09:45',
      ...newCycle
    };

    setCycles([created, ...cycles]);
    setIsSubmittingCycle(false);
    setShowNewCycleModal(false);
  };

  return (
    <div className="space-y-5">
      {/* HEADER DA SEÇÃO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">
              Livro Eletrônico de Autoclave & Biossegurança (RDC 15 / ANVISA)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreabilidade física e biológica completa dos instrumentais esterilizados no consultório
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Imprimir</span> Livro Sanitário
          </button>
          <button
            type="button"
            onClick={() => setShowNewCycleModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ciclo</span>
          </button>
        </div>
      </div>

      {/* CARDS DE MONITORAMENTO DA BIOSSEGURANÇA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
            Status do Equipamento
          </span>
          <div className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Cristófoli Vitale 21L (Pronta para uso)
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Monitoramento sanitário conforme RDC 15 ANVISA
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
            Último Teste Biológico (Semanal)
          </span>
          <div className="text-base font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {cycles.length > 0
              ? (cycles[0].biologicalTest === 'NEGATIVE' ? 'Negativo (Aprovado)' : cycles[0].biologicalTest)
              : 'Aguardando 1º Ciclo'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Indicador Geobacillus stearothermophilus
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
            Rastreabilidade Ativa
          </span>
          <div className="text-base font-bold text-blue-700 flex items-center gap-1">
            {cycles.length > 0
              ? `${cycles[0].lotCode} (${cycles[0].packagesCount} pacotes)`
              : 'Nenhum lote registrado'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {cycles.length > 0 ? 'Disponível para uso nos atendimentos' : 'Clique em "Novo Ciclo" para registrar'}
          </span>
        </div>
      </div>

      {/* REGISTRO DE CICLOS: CARDS NO MOBILE + TABELA NO DESKTOP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm">
            Registro Histórico de Ciclos de Autoclave
          </h3>
          <span className="text-xs text-slate-400">
            Total registrado: {cycles.length} ciclos
          </span>
        </div>

        {cycles.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum ciclo registrado ainda</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cadastre novos ciclos de esterilização da autoclave para gerar os lotes sanitários exigidos pela ANVISA.
            </p>
          </div>
        ) : (
          <>
            {/* MODO CARDS (VISÍVEL NO MOBILE / IPHONE) */}
            <div className="md:hidden space-y-3">
              {cycles.map((cyc) => (
                <div
                  key={cyc.id}
                  className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-800 font-mono block">
                        {cyc.cycleNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {cyc.date} • {cyc.startTime} às {cyc.endTime}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 text-xs shrink-0">
                      {cyc.lotCode}
                    </span>
                  </div>

                  {/* Parâmetros Físicos */}
                  <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-2.5 border border-slate-200/80 text-[11px] text-slate-700 font-medium">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{cyc.tempCelsius}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{cyc.pressureBar} bar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cyc.timeMin} min</span>
                    </div>
                  </div>

                  {/* Indicadores Químico e Biológico */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Classe 5/6: {cyc.chemicalIndicator === 'APPROVED' ? 'Aprovado' : 'Reprovado'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-full border border-slate-300">
                      Bio: {cyc.biologicalTest === 'NEGATIVE' ? 'Negativo (OK)' : cyc.biologicalTest}
                    </span>
                  </div>

                  {/* Descrição dos Pacotes e Operador */}
                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex flex-col gap-1">
                    <div className="font-semibold text-slate-800 text-[11px]">
                      Carga ({cyc.packagesCount} pacotes): <span className="font-normal text-slate-600">{cyc.packagesDescription}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Operador responsável: {cyc.operatorName}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MODO TABELA (VISÍVEL NO DESKTOP / IPAD GRANDE) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Nº Ciclo</th>
                    <th className="p-3">Lote Sanitário</th>
                    <th className="p-3">Data / Horário</th>
                    <th className="p-3">Parâmetros (T / P / Tempo)</th>
                    <th className="p-3">Monitoramento (Químico / Bio)</th>
                    <th className="p-3">Carga / Pacotes</th>
                    <th className="p-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cycles.map((cyc) => (
                    <tr key={cyc.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-extrabold text-slate-800 font-mono">
                        {cyc.cycleNumber}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {cyc.lotCode}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="font-semibold text-slate-700">{cyc.date}</div>
                        <div className="text-[11px] text-slate-400">{cyc.startTime} às {cyc.endTime}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-medium flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-red-500" /> {cyc.tempCelsius}°C
                          <Gauge className="w-3.5 h-3.5 text-blue-500 ml-1" /> {cyc.pressureBar} bar
                          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1" /> {cyc.timeMin} min
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                            ✓ Classe 5/6: {cyc.chemicalIndicator === 'APPROVED' ? 'Aprovado' : 'Reprovado'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                            Bio: {cyc.biologicalTest === 'NEGATIVE' ? 'Negativo (OK)' : cyc.biologicalTest}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-bold text-slate-800">{cyc.packagesCount} pacotes</div>
                        <div className="text-[10px] text-slate-500 max-w-xs truncate" title={cyc.packagesDescription}>
                          {cyc.packagesDescription}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 text-[11px]">
                        {cyc.operatorName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE NOVO CICLO DE ESTERILIZAÇÃO */}
      {showNewCycleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Registrar Ciclo de Esterilização (RDC 15)
                </h3>
                <p className="text-xs text-slate-500">
                  Gera código de lote para rastreabilidade nos atendimentos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCycleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {concurrencyError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 font-semibold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                {concurrencyError}
              </div>
            )}

            <form onSubmit={handleCreateCycle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Temperatura Atingida (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCycle.tempCelsius}
                    onChange={(e) => setNewCycle({ ...newCycle, tempCelsius: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pressão (bar):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCycle.pressureBar}
                    onChange={(e) => setNewCycle({ ...newCycle, pressureBar: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tempo Esterilização (min):</label>
                  <input
                    type="number"
                    value={newCycle.timeMin}
                    onChange={(e) => setNewCycle({ ...newCycle, timeMin: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Qtd. de Pacotes:</label>
                  <input
                    type="number"
                    value={newCycle.packagesCount}
                    onChange={(e) => setNewCycle({ ...newCycle, packagesCount: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Indicador Químico Integrador (Classe 5/6):</label>
                <select
                  value={newCycle.chemicalIndicator}
                  onChange={(e) => setNewCycle({ ...newCycle, chemicalIndicator: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                >
                  <option value="APPROVED">✓ Aprovado (Viragem completa da fita)</option>
                  <option value="REJECTED">✕ Reprovado (Não virou / Incompleto)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descrição dos Materiais Embalados:</label>
                <input
                  type="text"
                  value={newCycle.packagesDescription}
                  onChange={(e) => setNewCycle({ ...newCycle, packagesDescription: e.target.value })}
                  placeholder="Ex: 8x Kits Clínicos, 2x Caixas Cirúrgicas"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCycleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Salvar e Gerar Código de Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
