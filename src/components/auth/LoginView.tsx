import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import {
  authenticateClinic,
  saveActiveSession,
  saveActiveRole
} from '../../services/storage';
import { api } from '../../services/api';
import { ClinicSession } from '../../types/auth';

interface LoginViewProps {
  onLoginSuccess: (session: ClinicSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Submissão do Login com backend Express + SQLite
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!login.trim() || !password.trim()) {
      setErrorMessage('Informe o usuário/e-mail e a senha de acesso da clínica.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.auth.login(login, password);
      saveActiveSession(response.session);
      saveActiveRole('RECEPTIONIST', response.session.clinicId);
      setIsLoading(false);
      onLoginSuccess(response.session);
    } catch (err: any) {
      // Fallback gracioso para autenticação local
      const clinic = authenticateClinic(login, password);
      if (clinic) {
        const session: ClinicSession = {
          clinicId: clinic.id,
          clinicName: clinic.name,
          dentistName: clinic.dentistName,
          dentistCro: clinic.dentistCro,
          login: clinic.login,
          loggedAt: new Date().toISOString(),
          role: 'RECEPTIONIST'
        };
        saveActiveSession(session);
        saveActiveRole('RECEPTIONIST', clinic.id);
        setIsLoading(false);
        onLoginSuccess(session);
        return;
      }

      setErrorMessage(err.message || 'Credenciais inválidas. Verifique o login e a senha digitados.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-3 sm:p-6 font-sans relative overflow-x-hidden">
      {/* Background Decorativo Suave */}
      <div className="absolute inset-0 bg-radial from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Topo do Header */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
            🦷
          </div>
          <div>
            <span className="text-white font-extrabold text-base sm:text-lg tracking-tight block">
              GerenciaOdonto
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-semibold">
              Sistema de Gestão Clínica & Paperless
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ambiente Seguro</span>
        </div>
      </div>

      {/* Card Central de Login */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-6 sm:py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acesso ao Consultório</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Entrar no Sistema
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Digite suas credenciais para gerenciar prontuários, agendamentos e finanças.
            </p>
          </div>

          {/* Destaque das Credenciais da Clínica */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-blue-950 truncate">admin@consultorio.com</p>
                <p className="text-[11px] text-blue-700">Senha: <span className="font-mono font-semibold">senha123</span></p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 shrink-0">
              Padrão
            </span>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="admin@consultorio.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-blue-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-blue-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Lembrar neste computador</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Consultório</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Rodapé Informativo & LGPD */}
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center py-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>🔒 Criptografia Local-First</span>
          <span>•</span>
          <span>Isolamento Estrito de Prontuários</span>
          <span>•</span>
          <span>Conformidade CFO & LGPD</span>
        </p>
        <p className="text-slate-500 text-[10px]">
          GerenciaOdonto • Prontuário Odontológico Digital e Gestão Integrada.
        </p>
      </div>
    </div>
  );
};
