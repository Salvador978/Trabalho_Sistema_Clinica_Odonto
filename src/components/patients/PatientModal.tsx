import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  MapPin,
  ShieldAlert,
  CreditCard,
  X,
  Check,
  Search,
  AlertTriangle,
  Loader2,
  Calendar,
  Mail,
  HeartPulse,
  Baby,
  FileText
} from 'lucide-react';
import {
  Patient,
  ClinicalStatus,
  calculateAge,
  formatCPF,
  isValidCPF,
  formatPhone,
  formatCEP
} from '../../types/patient';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  patientToEdit?: Patient | null;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patientToEdit
}) => {
  // Seção ativa do modal para navegação ágil
  const [activeSection, setActiveSection] = useState<'PERSONAL' | 'CONTACT' | 'FISCAL' | 'HEALTH'>('PERSONAL');

  // 1. Dados Pessoais
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [rgIssuer, setRgIssuer] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE');
  const [profession, setProfession] = useState('');

  // 2. Contato & Endereço
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [email, setEmail] = useState('');

  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  // 3. Responsável Financeiro (DMED)
  const [hasFinancialResponsible, setHasFinancialResponsible] = useState(false);
  const [financialResponsibleName, setFinancialResponsibleName] = useState('');
  const [financialResponsibleCpf, setFinancialResponsibleCpf] = useState('');
  const [financialResponsibleRelationship, setFinancialResponsibleRelationship] = useState('Pai');

  // 4. Alertas Médicos
  const [hypertension, setHypertension] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [anticoagulant, setAnticoagulant] = useState(false);
  const [allergicPenicillin, setAllergicPenicillin] = useState(false);
  const [allergicAnesthetics, setAllergicAnesthetics] = useState(false);
  const [allergicDipyroneNSAIDs, setAllergicDipyroneNSAIDs] = useState(false);
  const [pregnantOrLactating, setPregnantOrLactating] = useState(false);
  const [otherConditions, setOtherConditions] = useState('');

  // 5. Status Clínico & Notas
  const [status, setStatus] = useState<ClinicalStatus>('IN_TREATMENT');
  const [notes, setNotes] = useState('');

  // Validação de formulário
  const [errorMessage, setErrorMessage] = useState('');

  // Carrega ou reseta formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setCepError('');
      if (patientToEdit) {
        setName(patientToEdit.name || '');
        setCpf(patientToEdit.cpf || '');
        setRg(patientToEdit.rg || '');
        setRgIssuer(patientToEdit.rgIssuer || '');
        setBirthDate(patientToEdit.birthDate || '');
        setGender(patientToEdit.gender || 'FEMALE');
        setProfession(patientToEdit.profession || '');

        setPhone(patientToEdit.phone || '');
        setSecondaryPhone(patientToEdit.secondaryPhone || '');
        setEmergencyContactName(patientToEdit.emergencyContactName || '');
        setEmail(patientToEdit.email || '');

        setCep(patientToEdit.cep || '');
        setAddress(patientToEdit.address || '');
        setNumber(patientToEdit.number || '');
        setComplement(patientToEdit.complement || '');
        setNeighborhood(patientToEdit.neighborhood || '');
        setCity(patientToEdit.city || '');
        setState(patientToEdit.state || 'SP');

        setHasFinancialResponsible(Boolean(patientToEdit.hasFinancialResponsible));
        setFinancialResponsibleName(patientToEdit.financialResponsibleName || '');
        setFinancialResponsibleCpf(patientToEdit.financialResponsibleCpf || '');
        setFinancialResponsibleRelationship(patientToEdit.financialResponsibleRelationship || 'Pai');

        setHypertension(Boolean(patientToEdit.medicalAlerts?.hypertension));
        setDiabetes(Boolean(patientToEdit.medicalAlerts?.diabetes));
        setAnticoagulant(Boolean(patientToEdit.medicalAlerts?.anticoagulant));
        setAllergicPenicillin(Boolean(patientToEdit.medicalAlerts?.allergicPenicillin));
        setAllergicAnesthetics(Boolean(patientToEdit.medicalAlerts?.allergicAnesthetics));
        setAllergicDipyroneNSAIDs(Boolean(patientToEdit.medicalAlerts?.allergicDipyroneNSAIDs));
        setPregnantOrLactating(Boolean(patientToEdit.medicalAlerts?.pregnantOrLactating));
        setOtherConditions(patientToEdit.medicalAlerts?.otherConditions || '');

        setStatus(patientToEdit.status || 'IN_TREATMENT');
        setNotes(patientToEdit.notes || '');
      } else {
        // Novo cadastro
        setName('');
        setCpf('');
        setRg('');
        setRgIssuer('');
        setBirthDate('');
        setGender('FEMALE');
        setProfession('');

        setPhone('');
        setSecondaryPhone('');
        setEmergencyContactName('');
        setEmail('');

        setCep('');
        setAddress('');
        setNumber('');
        setComplement('');
        setNeighborhood('');
        setCity('São Paulo');
        setState('SP');

        setHasFinancialResponsible(false);
        setFinancialResponsibleName('');
        setFinancialResponsibleCpf('');
        setFinancialResponsibleRelationship('Pai');

        setHypertension(false);
        setDiabetes(false);
        setAnticoagulant(false);
        setAllergicPenicillin(false);
        setAllergicAnesthetics(false);
        setAllergicDipyroneNSAIDs(false);
        setPregnantOrLactating(false);
        setOtherConditions('');

        setStatus('IN_TREATMENT');
        setNotes('');
      }
      setActiveSection('PERSONAL');
    }
  }, [isOpen, patientToEdit]);

  // Consulta automática na API ViaCEP
  const handleFetchCep = async (cepToSearch: string) => {
    const clean = cepToSearch.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setIsLoadingCep(true);
    setCepError('');

    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      if (!res.ok) throw new Error('Falha na conexão com ViaCEP');
      const data = await res.json();

      if (data.erro) {
        setCepError('CEP não encontrado na base dos Correios.');
      } else {
        setAddress(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || 'SP');
      }
    } catch {
      setCepError('Não foi possível consultar o CEP automaticamente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      handleFetchCep(clean);
    }
  };

  // Cálculo de idade
  const calculatedAge = calculateAge(birthDate);

  // Manipulador de salvar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('O Nome Completo do paciente é obrigatório.');
      setActiveSection('PERSONAL');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('O número de WhatsApp / Celular é obrigatório.');
      setActiveSection('CONTACT');
      return;
    }

    // Se CPF foi informado, valida os 11 dígitos
    if (cpf.trim()) {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11 || !isValidCPF(cpf)) {
        setErrorMessage('O CPF informado é inválido. Verifique os números digitados.');
        setActiveSection('PERSONAL');
        return;
      }
    }

    // Se possui responsável financeiro, valida os dados dele
    if (hasFinancialResponsible) {
      if (!financialResponsibleName.trim()) {
        setErrorMessage('Informe o nome completo do Responsável Financeiro.');
        setActiveSection('FISCAL');
        return;
      }
      if (financialResponsibleCpf.trim()) {
        const cleanPayerCpf = financialResponsibleCpf.replace(/\D/g, '');
        if (cleanPayerCpf.length !== 11 || !isValidCPF(financialResponsibleCpf)) {
          setErrorMessage('O CPF do Responsável Financeiro é inválido.');
          setActiveSection('FISCAL');
          return;
        }
      }
    }

    // Compila lista de alergias textuais
    const allergiesList: string[] = [];
    if (allergicPenicillin) allergiesList.push('Penicilina / Amoxicilina');
    if (allergicAnesthetics) allergiesList.push('Anestésicos Locais');
    if (allergicDipyroneNSAIDs) allergiesList.push('Dipirona / AINEs');

    const updatedPatient: Patient = {
      id: patientToEdit ? patientToEdit.id : `pat_${crypto.randomUUID()}`,
      name: name.trim(),
      cpf: cpf.trim(),
      rg: rg.trim() || undefined,
      rgIssuer: rgIssuer.trim() || undefined,
      birthDate: birthDate || '',
      gender,
      profession: profession.trim() || undefined,

      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim() || undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      email: email.trim() || undefined,

      cep: cep.trim() || undefined,
      address: address.trim() || undefined,
      number: number.trim() || undefined,
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,

      hasFinancialResponsible,
      financialResponsibleName: hasFinancialResponsible ? financialResponsibleName.trim() : undefined,
      financialResponsibleCpf: hasFinancialResponsible ? financialResponsibleCpf.trim() : undefined,
      financialResponsibleRelationship: hasFinancialResponsible ? financialResponsibleRelationship : undefined,

      medicalAlerts: {
        hypertension,
        diabetes,
        anticoagulant,
        allergicPenicillin,
        allergicAnesthetics,
        allergicDipyroneNSAIDs,
        pregnantOrLactating,
        otherConditions: otherConditions.trim() || undefined,
        allergies: allergiesList
      },

      status,
      notes: notes.trim() || undefined,
      lastAppointmentDate: patientToEdit?.lastAppointmentDate || new Date().toISOString().split('T')[0],
      createdAt: patientToEdit ? patientToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(updatedPatient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER DO MODAL */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {patientToEdit ? 'Editar Prontuário do Paciente' : 'Novo Cadastro de Paciente'}
              </h3>
              <p className="text-xs text-slate-300">
                Cadastro integral para prontuário, receitas, agenda e conformidade fiscal DMED
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE SEÇÕES DO FORMULÁRIO */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('PERSONAL')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeSection === 'PERSONAL'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            1. Identificação
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('CONTACT')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeSection === 'CONTACT'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            2. Contato & Endereço
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('FISCAL')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeSection === 'FISCAL'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            3. Responsável DMED
            {hasFinancialResponsible && (
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('HEALTH')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeSection === 'HEALTH'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-red-500" />
            4. Alertas Médicos & Status
            {(hypertension || diabetes || anticoagulant || allergicPenicillin || allergicAnesthetics || pregnantOrLactating) && (
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
            )}
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO COM SCROLL */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SEÇÃO 1: DADOS PESSOAIS & IDENTIFICAÇÃO                         */}
          {/* ============================================================== */}
          {activeSection === 'PERSONAL' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Identificação Civil & Registro Profissional
                </h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Paciente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Ferreira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF (Titular)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {cpf && cpf.replace(/\D/g, '').length === 11 && (
                    <span className={`text-[10px] font-semibold mt-1 inline-block ${isValidCPF(cpf) ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isValidCPF(cpf) ? '✓ CPF válido para DMED' : '⚠️ CPF com dígito inválido'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RG / Órgão Emissor
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: 34.567.890-1"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      className="flex-1 text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="SSP/SP"
                      value={rgIssuer}
                      onChange={(e) => setRgIssuer(e.target.value)}
                      className="w-24 text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      const age = calculateAge(e.target.value);
                      if (age !== null && age < 18) {
                        setHasFinancialResponsible(true);
                      }
                    }}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {calculatedAge !== null && (
                    <span className="text-[11px] font-bold text-blue-600 mt-1 inline-block">
                      Idade: {calculatedAge} anos {calculatedAge < 18 ? '👶 (Menor de Idade)' : ''}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sexo Biológico / Gênero
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="FEMALE">Feminino</option>
                    <option value="MALE">Masculino</option>
                    <option value="OTHER">Outro / Prefere não declarar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SEÇÃO 2: CONTATO & ENDEREÇO COM VIACEP                         */}
          {/* ============================================================== */}
          {activeSection === 'CONTACT' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Canais de Comunicação & Localização
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp Principal (Lembretes & Recibos) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      maxLength={15}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 pl-8 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail do Paciente
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="paciente@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 pl-8 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contato de Emergência (Nome & Grau)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maria (Esposa) ou Carlos (Pai)"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone do Contato de Emergência
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={secondaryPhone}
                      onChange={(e) => setSecondaryPhone(formatPhone(e.target.value))}
                      maxLength={15}
                      className="w-full text-xs border border-slate-300 rounded-xl p-2.5 pl-8 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-amber-600 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO & BUSCA VIACEP */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Endereço Residencial (Busca Automática via CEP)
                  </span>
                  {isLoadingCep && (
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando no ViaCEP...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      CEP (8 dígitos)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={handleCepChange}
                        maxLength={9}
                        className="flex-1 text-xs font-mono border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchCep(cep)}
                        disabled={isLoadingCep}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Buscar endereço nos Correios"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {cepError && (
                      <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                        {cepError}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Logradouro (Rua, Avenida, Praça)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rua Bela Cintra"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      placeholder="Apto 42"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      placeholder="Consolação"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        placeholder="São Paulo"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="w-14">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        UF
                      </label>
                      <input
                        type="text"
                        placeholder="SP"
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        maxLength={2}
                        className="w-full text-xs text-center border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SEÇÃO 3: RESPONSÁVEL FINANCEIRO (CONFORMIDADE DMED)            */}
          {/* ============================================================== */}
          {activeSection === 'FISCAL' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Responsabilidade Fiscal & DMED (Receita Federal)
                </h4>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="hasFinancialResponsible"
                    checked={hasFinancialResponsible}
                    onChange={(e) => setHasFinancialResponsible(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="hasFinancialResponsible" className="text-xs font-bold text-slate-800 cursor-pointer">
                    O paciente é dependente financeiro ou menor de idade?
                    <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                      Ative se os recibos de quitação e o informe anual para o Imposto de Renda (DMED / Carnê-Leão) devam ser emitidos no nome e CPF de outra pessoa (ex: Pai, Mãe ou Cônjuge).
                    </p>
                  </label>
                </div>

                {hasFinancialResponsible && (
                  <div className="pt-3 border-t border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Completo do Responsável Financeiro <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Marcos Correia"
                        value={financialResponsibleName}
                        onChange={(e) => setFinancialResponsibleName(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Grau de Parentesco
                      </label>
                      <select
                        value={financialResponsibleRelationship}
                        onChange={(e) => setFinancialResponsibleRelationship(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Pai">Pai</option>
                        <option value="Mãe">Mãe</option>
                        <option value="Cônjuge">Cônjuge</option>
                        <option value="Responsável Legal">Responsável Legal (Tutor)</option>
                        <option value="Outro">Outro Familiar</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        CPF do Responsável Financeiro (para DMED)
                      </label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={financialResponsibleCpf}
                        onChange={(e) => setFinancialResponsibleCpf(formatCPF(e.target.value))}
                        maxLength={14}
                        className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {financialResponsibleCpf && financialResponsibleCpf.replace(/\D/g, '').length === 11 && (
                        <span className={`text-[10px] font-semibold mt-1 inline-block ${isValidCPF(financialResponsibleCpf) ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isValidCPF(financialResponsibleCpf) ? '✓ CPF do declarante válido' : '⚠️ CPF com dígito inválido'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SEÇÃO 4: ALERTAS MÉDICOS CRÍTICOS & STATUS CLÍNICO             */}
          {/* ============================================================== */}
          {activeSection === 'HEALTH' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Triagem & Alertas Médicos Críticos (Antes da Anamnese Formal)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Hipertensão */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${hypertension ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={hypertension}
                    onChange={(e) => setHypertension(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Hipertensão Arterial
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Cuidado especial com vasoconstritores (Epinefrina)
                    </span>
                  </div>
                </label>

                {/* Diabetes */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${diabetes ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={diabetes}
                    onChange={(e) => setDiabetes(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Diabetes Mellitus
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Risco cirúrgico e cicatrização tecidual
                    </span>
                  </div>
                </label>

                {/* Anticoagulantes */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${anticoagulant ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={anticoagulant}
                    onChange={(e) => setAnticoagulant(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Uso Contínuo de Anticoagulante
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Atenção para risco de hemorragia em exodontias
                    </span>
                  </div>
                </label>

                {/* Gestante / Lactante */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${pregnantOrLactating ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={pregnantOrLactating}
                    onChange={(e) => setPregnantOrLactating(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded-sm border-slate-300 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Gestante / Lactante
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Restrição para radiografias e certos AINEs
                    </span>
                  </div>
                </label>

                {/* Alergia Penicilina */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allergicPenicillin ? 'bg-red-100 border-red-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={allergicPenicillin}
                    onChange={(e) => setAllergicPenicillin(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-900 block">
                      ⛔ Alergia a Penicilina / Amoxicilina
                    </span>
                    <span className="text-[10px] text-red-700">
                      Substituir por Clindamicina ou Azitromicina
                    </span>
                  </div>
                </label>

                {/* Alergia Anestésicos */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allergicAnesthetics ? 'bg-red-100 border-red-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={allergicAnesthetics}
                    onChange={(e) => setAllergicAnesthetics(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-900 block">
                      ⛔ Alergia a Anestésicos Locais
                    </span>
                    <span className="text-[10px] text-red-700">
                      Verificar histórico de alergia a sulfitos ou amidas
                    </span>
                  </div>
                </label>

                {/* Alergia Dipirona / AINEs */}
                <label className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${allergicDipyroneNSAIDs ? 'bg-red-100 border-red-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input
                    type="checkbox"
                    checked={allergicDipyroneNSAIDs}
                    onChange={(e) => setAllergicDipyroneNSAIDs(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded-sm border-slate-300 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-900 block">
                      ⛔ Alergia a Dipirona / AINEs
                    </span>
                    <span className="text-[10px] text-red-700">
                      Evitar Dipirona, Ibuprofeno e Cetoprofeno
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Outras Condições, Medicamentos Contínuos ou Queixas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Portador de marca-passo, uso de Sinvastatina, gastrite crônica..."
                  value={otherConditions}
                  onChange={(e) => setOtherConditions(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status Clínico */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Clínico Atual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClinicalStatus)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="IN_TREATMENT">🔵 Em Tratamento (Consultas ativas)</option>
                    <option value="CLINICAL_DISCHARGE">🟢 Alta Clínica (Tratamento concluído)</option>
                    <option value="RECALL_DUE">🟠 Retorno Preventivo / Recall Semestral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Administrativas do Cadastro
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Preferência por horários matutinos..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOTÕES DE NAVEGAÇÃO E SUBMIT */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeSection !== 'PERSONAL' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeSection === 'CONTACT') setActiveSection('PERSONAL');
                    if (activeSection === 'FISCAL') setActiveSection('CONTACT');
                    if (activeSection === 'HEALTH') setActiveSection('FISCAL');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  ← Anterior
                </button>
              )}
              {activeSection !== 'HEALTH' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeSection === 'PERSONAL') setActiveSection('CONTACT');
                    if (activeSection === 'CONTACT') setActiveSection('FISCAL');
                    if (activeSection === 'FISCAL') setActiveSection('HEALTH');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                >
                  Próximo Passo →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {patientToEdit ? 'Salvar Alterações' : 'Concluir Cadastro'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
