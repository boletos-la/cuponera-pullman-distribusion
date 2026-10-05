'use client';

import React, { useState, useEffect } from 'react';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { Search, LayoutDashboard, Ticket, Clock, CheckCircle, Mail, ArrowRight, AlertCircle, Ban, ShieldCheck, KeyRound, Star, MapPin, Target, ShoppingCart, Loader2, Info } from 'lucide-react';
import { couponService } from '@/lib/services/couponService';
import { getAuthUser } from '@/lib/apiClient';
import ProfileTab from './ProfileTab';
import HistoryTab from './HistoryTab';

interface DashboardViewProps {
  initialRut?: string;
  onCanjearCupon: (codigoCupon: string, rut: string) => void;
  onResetRut?: () => void;
}

export default function DashboardView({ initialRut = '', onCanjearCupon, onResetRut }: DashboardViewProps) {
  const [rutInput, setRutInput] = useState(initialRut ? formatRut(initialRut) : '');
  const [loading, setLoading] = useState(false);
  const [rutError, setRutError] = useState('');
  const [step, setStep] = useState<'login' | 'dashboard'>('login');

  const [rutFormateado, setRutFormateado] = useState('');
  const [metricas, setMetricas] = useState({ disponibles: 0, utilizados: 0, vencidos: 0, total: 0 });
  const [cuponeras, setCuponeras] = useState<any[]>([]);
  const [historialCompras, setHistorialCompras] = useState<any[]>([]);
  const [historialCanjes, setHistorialCanjes] = useState<any[]>([]);

  const [searchCuponeras, setSearchCuponeras] = useState('');
  const [nowTimestamp, setNowTimestamp] = useState<number | null>(null);

  const [activeDashboardTab, setActiveDashboardTab] = useState<'cuponeras' | 'historial'>('cuponeras');

  const authUser = getAuthUser();
  const [isInitialLoading, setIsInitialLoading] = useState(!!initialRut || !!authUser?.rut);

  useEffect(() => {
    if (initialRut) {
      setRutInput(formatRut(initialRut));
      loadDashboard(initialRut).finally(() => setIsInitialLoading(false));
    } else {
      if (authUser && authUser.rut) {
        setRutInput(formatRut(authUser.rut));
        loadDashboard(authUser.rut).finally(() => setIsInitialLoading(false));
      } else {
        setStep('login');
        setRutInput('');
        setRutFormateado('');
        setCuponeras([]);
        setHistorialCompras([]);
        setHistorialCanjes([]);
        setRutError('');
        setIsInitialLoading(false);
      }
    }
  }, [initialRut]);

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const handleResetSearch = () => {
    setStep('login');
    setRutInput('');
    setRutFormateado('');
    setCuponeras([]);
    setHistorialCompras([]);
    setHistorialCanjes([]);
    setRutError('');
    if (onResetRut) {
      onResetRut();
    }
  };

  const handleRequestDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setRutError('');
    const cleaned = cleanRut(rutInput);

    if (!validateRut(cleaned)) {
      setRutError('RUT inválido según el algoritmo chileno Módulo 11.');
      return;
    }

    setLoading(true);
    await loadDashboard(formatRut(cleaned));
  };

  const loadDashboard = async (rut: string) => {
    try {
      const res = await couponService.getDashboard(rut);
      if (res.success) {
        setCuponeras(res.cupones || []);
        setHistorialCompras(res.historialCompras || []);
        setHistorialCanjes(res.historialCanjes || []);

        if (res.rutFormateado) {
          setRutFormateado(res.rutFormateado);
        }

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
      setStep('login');
      setRutError(err.message || 'No se pudieron cargar las cuponeras para este RUT.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return 90;
    if (nowTimestamp === null) return 90;
    const exp = new Date(fechaVencimiento).getTime();
    const diffDays = Math.ceil((exp - nowTimestamp) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className={`space-y-6 ${(step === 'login' || isInitialLoading) ? 'max-w-3xl mt-6 md:mt-8' : 'w-full'} mx-auto`}>
      {isInitialLoading ? (
        <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-[#fa5e00] animate-spin mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Cargando tus cuponeras...</h3>
          <p className="text-sm text-slate-500 mt-2">Estamos recuperando tu información</p>
        </div>
      ) : (
        <>
          {step === 'login' && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#023caf]" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-slate-100 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#023caf] flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
              <LayoutDashboard className="w-8 h-8 text-[#023caf]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-[#023caf]">
                Mis Cuponeras
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Ingresa tu RUT para consultar tus cuponeras y saldo disponible.
              </p>
            </div>
          </div>

          {rutError && <p className="text-xs text-red-600 font-bold mt-1">{rutError}</p>}

          <form onSubmit={handleRequestDashboard} className="space-y-4">
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
                    const formatted = formatRut(e.target.value);
                    setRutInput(formatted);
                    const cleaned = cleanRut(e.target.value);
                    if (cleaned.length >= 8) {
                      if (!validateRut(cleaned)) {
                        setRutError('RUT inválido. Verifique el dígito verificador.');
                      } else {
                        setRutError('');
                      }
                    } else {
                      setRutError('');
                    }
                  }}
                  className={`w-full text-sm font-semibold bg-white border rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 text-[#0F172A] ${
                    rutError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-[#fa5e00]'
                  }`}
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
              </div>
            </div>

            {rutError && <p className="text-xs text-red-600 font-bold mt-1">{rutError}</p>}

            <button
              type="submit"
              disabled={loading || !rutInput}
              className="w-full bg-[#fa5e00] hover:bg-[#e55400] text-white font-extrabold py-4 px-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Buscar Cuponeras</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {step === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tarjetas Consolidadas de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-emerald-500 border-t border-r border-b border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Disponibles</span>
                <span className="text-2xl font-black text-emerald-700">{metricas.disponibles}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-[#023caf] border-t border-r border-b border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-[#023caf]" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Usados</span>
                <span className="text-2xl font-black text-[#023caf]">{metricas.utilizados}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border-l-4 border-l-slate-800 border-t border-r border-b border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Adquiridos</span>
                <span className="text-2xl font-black text-slate-900">{metricas.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 sm:p-8 space-y-6 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#023caf] rounded-t-[2rem]" />
            <div className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-md pb-4 pt-4 border-b border-slate-100 shadow-[0_8px_10px_-4px_rgba(255,255,255,0.9)] -mx-6 px-6 sm:-mx-8 sm:px-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-[-8px] rounded-t-[1.5rem]">
              <div className="flex flex-wrap gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200">
                <button
                  onClick={() => setActiveDashboardTab('cuponeras')}
                  className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${activeDashboardTab === 'cuponeras' ? 'bg-[#023caf] text-white shadow-md' : 'text-slate-600 hover:text-[#023caf] hover:bg-white'}`}
                >
                  Mis Cuponeras
                </button>
                <button
                  onClick={() => setActiveDashboardTab('historial')}
                  className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all ${activeDashboardTab === 'historial' ? 'bg-[#023caf] text-white shadow-md' : 'text-slate-600 hover:text-[#023caf] hover:bg-white'}`}
                >
                  Historial
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold bg-blue-50 text-[#023caf] px-4 py-2 rounded-full border border-blue-200 shadow-xs">
                  Titular: {rutFormateado}
                </span>
                {!authUser && (
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="text-xs font-bold text-[#fa5e00] hover:text-white bg-orange-50 hover:bg-[#fa5e00] px-4 py-2 rounded-full border border-orange-200 hover:border-[#fa5e00] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Consultar otro RUT"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Nueva Consulta</span>
                  </button>
                )}
              </div>
            </div>

            {activeDashboardTab === 'cuponeras' && (
              <>
                <div className="mb-4 sticky top-[154px] z-30 bg-white/95 backdrop-blur-sm py-3 -mx-6 px-6 sm:-mx-8 sm:px-8 shadow-[0_8px_10px_-4px_rgba(255,255,255,0.9)]">
                  <div className="relative w-full max-w-sm">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o tramo..."
                      value={searchCuponeras}
                      onChange={(e) => setSearchCuponeras(e.target.value)}
                      className="w-full text-sm font-medium bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fa5e00] text-[#0F172A]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                  </div>
                </div>
                {cuponeras.filter(c =>
                  c.nombreCuponera?.toLowerCase().includes(searchCuponeras.toLowerCase()) ||
                  c.codigo?.toLowerCase().includes(searchCuponeras.toLowerCase()) ||
                  c.tramosPermitidos?.join(' ').toLowerCase().includes(searchCuponeras.toLowerCase())
                ).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="font-bold text-slate-700">No se encontraron cuponeras registradas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {cuponeras.filter(c =>
                      c.nombreCuponera?.toLowerCase().includes(searchCuponeras.toLowerCase()) ||
                      c.codigo?.toLowerCase().includes(searchCuponeras.toLowerCase()) ||
                      c.tramosPermitidos?.join(' ').toLowerCase().includes(searchCuponeras.toLowerCase())
                    ).map((c) => {
                      const totalC = c.totalCupones || 10;
                      const saldoC = c.saldoDisponible || 0;
                      const daysLeft = getDaysLeft(c.fechaVencimiento);

                      const canCanjear = saldoC > 0 && c.estado === 'Activo';
                      const porcentajeSaldo = Math.round((saldoC / totalC) * 100);

                      return (
                        <div
                          key={c.codigo}
                          className={`relative bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow border border-slate-100 flex flex-col mt-4 ${!canCanjear ? 'opacity-80' : ''}`}
                        >
                          {/* Badge Activa / Sin Saldo */}
                          <div className={`absolute -top-3 right-4 font-bold text-xs px-3 py-1 rounded-full shadow-sm border border-white z-10 ${canCanjear ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                            {canCanjear ? 'Activa' : 'Agotada'}
                          </div>

                          {/* Card Content */}
                          <div className="p-6 pb-5 flex-1 flex flex-col">
                            {/* Info Tooltip (Absolute Top Right) */}
                            <div className="absolute top-4 right-4 z-20">
                              <div className="relative group flex items-center">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-help focus:outline-none">
                                  <Info className="w-3.5 h-3.5" />
                                </div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-100/90 backdrop-blur-md text-slate-800 text-[10px] p-3 rounded-xl shadow-xl z-50 border border-slate-200 transition-all duration-200 opacity-0 invisible -translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                                  <div className="font-semibold mb-1 text-slate-700 uppercase tracking-wider">Tramos Habilitados:</div>
                                  <ul className="list-disc pl-3 space-y-0.5 font-medium text-slate-600">
                                    {c.tramosPermitidos?.map((t: string, i: number) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Header con Logo */}
                            <div className="mb-2">
                              <img src="/logo-pullman-beneficios-tarjeta.png" alt="Pullmanbus" className="h-5 object-contain" />
                            </div>

                            {/* Nombre de la Cuponera */}
                            <h3 className="text-base font-semibold text-slate-900 leading-snug mb-1.5 capitalize min-h-[44px] line-clamp-2">
                              {c.nombreCuponera?.toLowerCase()}
                            </h3>

                            {/* Route details */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center gap-3 text-slate-600">
                                <Target className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-xs font-medium">{c.tramosPermitidos && c.tramosPermitidos.length > 0 ? c.tramosPermitidos[0].split('-')[0].trim() : 'Origen'}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-600">
                                <div className="flex items-center gap-3">
                                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="text-xs font-medium">{c.tramosPermitidos && c.tramosPermitidos.length > 0 ? c.tramosPermitidos[0].split('-')[1]?.trim() || 'Destino' : 'Destino'}</span>
                                </div>
                              </div>

                              {/* Días Restantes */}
                              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                                <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-2 ${daysLeft <= 7 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Quedan {daysLeft} días
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto"></div>

                            {/* Progress bar / Saldo */}
                            <div className="mb-4">
                              <div className="flex justify-between items-end mb-1.5">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saldo</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-black text-emerald-600">{saldoC}</span>
                                  <span className="text-xs font-bold text-slate-400">/ {totalC}</span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                                <div
                                  className={`h-full transition-all duration-500 ${saldoC > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                  style={{ width: `${porcentajeSaldo}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] font-bold text-slate-400">Código: {c.codigo}</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Button */}
                          <button
                            disabled={!canCanjear}
                            onClick={() => onCanjearCupon(c.codigo, rutFormateado)}
                            className={`w-full rounded-b-3xl px-6 py-4 flex justify-between items-center font-black text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${canCanjear ? 'bg-[#fa5e00] hover:bg-[#e55400] text-white' : 'bg-slate-200 text-slate-500'}`}
                          >
                            <span className="mx-auto flex items-center gap-2">
                              {canCanjear ? (
                                <>
                                  <span>Canjear Pasaje</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4" />
                                  <span>Agotada</span>
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeDashboardTab === 'historial' && (
              <HistoryTab
                compras={historialCompras}
                canjes={historialCanjes}
                isGuest={!authUser}
                onLoginRequest={() => setStep('login')}
              />
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
