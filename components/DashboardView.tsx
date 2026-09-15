'use client';

import React, { useState, useEffect } from 'react';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { Search, LayoutDashboard, Ticket, Clock, CheckCircle, Mail, ArrowRight, AlertCircle, Ban, ShieldCheck, KeyRound } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { couponService } from '@/lib/services/couponService';
import { setAuthToken } from '@/lib/apiClient';

interface DashboardViewProps {
  initialRut?: string;
  onCanjearCupon: (codigoCupon: string, rut: string) => void;
}

export default function DashboardView({ initialRut = '', onCanjearCupon }: DashboardViewProps) {
  const [rutInput, setRutInput] = useState(initialRut ? formatRut(initialRut) : '');
  const [emailInput, setEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [rutError, setRutError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'otp' | 'dashboard'>('login');
  
  const [rutFormateado, setRutFormateado] = useState('');
  const [metricas, setMetricas] = useState({ disponibles: 0, utilizados: 0, vencidos: 0, total: 0 });
  const [cuponeras, setCuponeras] = useState<any[]>([]);

  // Email update state
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');

  // 1. Solicitar OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRutError('');
    const cleaned = cleanRut(rutInput);

    if (!validateRut(cleaned)) {
      setRutError('RUT inválido según el algoritmo chileno Módulo 11.');
      return;
    }
    
    if (!emailInput) {
      setRutError('El correo es requerido para enviar el código.');
      return;
    }

    setLoading(true);
    try {
      const formattedRut = formatRut(cleaned);
      const res = await authService.sendOtp({ rut: formattedRut, correo: emailInput });
      if (res.success) {
        setRutFormateado(formattedRut);
        setStep('otp');
      }
    } catch (err: any) {
      setRutError(err.message || 'Error conectando con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar OTP y Cargar Dashboard
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRutError('');
    const cleaned = cleanRut(rutInput);

    setLoading(true);
    try {
      const formattedRut = formatRut(cleaned);
      const res = await authService.verifyOtp({ rut: formattedRut, otpCode });
      if (res.success && res.token) {
        setAuthToken(res.token); // Guardar JWT
        await loadDashboard();
      }
    } catch (err: any) {
      setRutError(err.message || 'Código OTP inválido.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Cargar Dashboard usando JWT
  const loadDashboard = async () => {
    try {
      const res = await couponService.getDashboard();
      if (res.success) {
        // El backend real retorna { success, rutFormateado, metricas, cupones }
        setCuponeras(res.cupones || []);
        
        if (res.metricas) {
          setMetricas({
            disponibles: res.metricas.disponibles || 0,
            utilizados: res.metricas.utilizados || 0,
            vencidos: res.metricas.vencidos || 0,
            total: res.metricas.total || 0
          });
        }
        
        setStep('dashboard');
      }
    } catch (err: any) {
      setRutError(err.message || 'Error al cargar el dashboard.');
    }
  };

  const getDaysLeft = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return 90;
    const exp = new Date(fechaVencimiento).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {step === 'login' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#FFE4D6] space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#F05A24] flex items-center justify-center shrink-0 shadow-2xs">
              <LayoutDashboard className="w-6 h-6 text-[#F05A24]" />
            </div>
            <div>
              <span className="bg-[#FFF5F0] text-[#F05A24] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#FED7AA]">
                Autenticación 2FA
              </span>
              <h2 className="text-2xl font-black text-[#0F172A] mt-1">
                Ingreso al Dashboard
              </h2>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                Ingresa tu RUT y correo para recibir un código de acceso único (OTP).
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                RUT del Titular
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ingresa tu RUT (ej: 12.345.678-K)"
                  value={rutInput}
                  onChange={(e) => {
                    setRutInput(formatRut(e.target.value));
                    setRutError('');
                  }}
                  className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24] text-[#0F172A]"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24] text-[#0F172A]"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
              </div>
            </div>

            {rutError && <p className="text-xs text-red-600 font-bold mt-1">{rutError}</p>}

            <button
              type="submit"
              disabled={loading || !rutInput}
              className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar al Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#FFE4D6] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#FFF5F0] text-[#F05A24] flex items-center justify-center mx-auto shadow-md">
              <KeyRound className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Validación de Seguridad</h3>
            <p className="text-xs text-slate-500">
              Hemos enviado un código de 6 dígitos a <span className="font-semibold text-slate-700">{emailInput}</span>.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                Código OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-48 mx-auto text-center text-2xl tracking-widest font-black bg-white border border-slate-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
              />
            </div>
            {rutError && <p className="text-xs text-red-600 font-bold text-center mt-1">{rutError}</p>}
            
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full bg-[#0A4DA6] hover:bg-blue-800 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Verificar y Entrar</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-slate-500 hover:text-slate-700 font-semibold text-xs py-2 cursor-pointer"
            >
              Volver
            </button>
          </form>
        </div>
      )}

      {step === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tarjetas Consolidadas de Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Disponibles</span>
                <span className="text-2xl font-black text-emerald-700">{metricas.disponibles}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0A4DA6] flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Usados</span>
                <span className="text-2xl font-black text-[#0A4DA6]">{metricas.utilizados}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Total Adquiridos</span>
                <span className="text-2xl font-black text-slate-900">{metricas.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Cuponeras Adquiridas ({cuponeras.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-[#0A4DA6] px-3 py-1 rounded-full border border-blue-200">
                Titular: {rutFormateado}
              </span>
            </div>

            {cuponeras.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-700">No se encontraron cuponeras registradas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cuponeras.map((c) => {
                  const totalC = c.totalCupones || 10;
                  const saldoC = c.saldoDisponible || 0;
                  const daysLeft = getDaysLeft(c.fechaVencimiento);
                  
                  const canCanjear = saldoC > 0 && c.estado === 'Activo';
                  const porcentajeSaldo = Math.round((saldoC / totalC) * 100);

                  return (
                    <div
                      key={c.codigo}
                      className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        canCanjear
                          ? 'border-emerald-200 bg-emerald-50/30 shadow-sm'
                          : 'border-slate-200 bg-slate-50 opacity-90'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-extrabold text-sm text-[#F05A24] bg-white px-3 py-1 rounded-lg border border-[#FFEDD5] shadow-xs">
                            ID: {c.codigo.split('WP')[1] || c.codigo}
                          </span>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${canCanjear ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white'}`}>
                            {canCanjear ? 'Activa' : 'Sin Saldo'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base text-slate-900">{c.nombreCuponera}</h4>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Saldo</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-emerald-600">{saldoC}</span>
                              <span className="text-sm font-bold text-slate-400">/ {totalC}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${saldoC > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            style={{ width: `${porcentajeSaldo}%` }}
                          />
                        </div>
                      </div>

                      <button
                        disabled={!canCanjear}
                        onClick={() => onCanjearCupon(c.id.toString(), rutFormateado)}
                        className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm ${
                          canCanjear
                            ? 'bg-[#F05A24] hover:bg-[#D94B18] text-white shadow-md cursor-pointer'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                      >
                        {canCanjear ? (
                          <>
                            <span>Canjear Pasaje</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 text-slate-400" />
                            <span>Agotada</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
