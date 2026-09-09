'use client';

import React, { useState, useEffect } from 'react';
import { Cupon } from '@/lib/dataStore';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { Search, LayoutDashboard, Ticket, Clock, CheckCircle, Mail, ArrowRight, AlertCircle, Ban, ShieldCheck } from 'lucide-react';

interface DashboardViewProps {
  initialRut?: string;
  onCanjearCupon: (codigoCupon: string, rut: string) => void;
}

export default function DashboardView({ initialRut = '', onCanjearCupon }: DashboardViewProps) {
  const [rutInput, setRutInput] = useState(initialRut ? formatRut(initialRut) : '');
  const [rutError, setRutError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [rutFormateado, setRutFormateado] = useState('');
  const [metricas, setMetricas] = useState({
    disponibles: 0,
    utilizados: 0,
    vencidos: 0,
    total: 0
  });
  const [cuponeras, setCuponeras] = useState<Cupon[]>([]);

  // Email update state
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');

  useEffect(() => {
    if (initialRut) {
      handleSearchByRut(initialRut);
    }
  }, [initialRut]);

  const handleSearchByRut = async (rutToSearch: string) => {
    setRutError('');
    const cleaned = cleanRut(rutToSearch);

    if (!validateRut(cleaned)) {
      setRutError('RUT inválido según el algoritmo chileno Módulo 11.');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/cupones?rut=${encodeURIComponent(cleaned)}`);
      const data = await res.json();

      if (data.success) {
        setRutFormateado(data.rutFormateado);
        setMetricas(data.metricas);
        setCuponeras(data.cupones);
        if (data.cupones.length > 0) {
          setNewEmail(data.cupones[0].emailCliente);
        }
      } else {
        setRutError(data.error || 'Error al consultar saldo de cupones.');
      }
    } catch (err) {
      setRutError('Error conectando con el servidor.');
    } fontally: {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rutInput) {
      handleSearchByRut(rutInput);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !rutFormateado) return;
    try {
      const res = await fetch('/api/cupones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: rutFormateado, nuevoEmail: newEmail })
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccessMsg('Correo de notificación actualizado correctamente.');
        setEditingEmail(false);
        setCuponeras((prev) => prev.map((c) => ({ ...c, emailCliente: newEmail })));
        setTimeout(() => setEmailSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper para días restantes de vigencia de 90 días
  const getDaysLeft = (fechaVencimiento: string) => {
    const exp = new Date(fechaVencimiento).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ---------------- PRIMERA INSTANCIA: TARJETA DE VALIDACIÓN POR RUT DE CUPONERAS ---------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#FFE4D6] space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#F05A24] flex items-center justify-center shrink-0 shadow-2xs">
            <LayoutDashboard className="w-6 h-6 text-[#F05A24]" />
          </div>
          <div>
            <span className="bg-[#FFF5F0] text-[#F05A24] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#FED7AA]">
              Autogestión de Cuponeras
            </span>
            <h2 className="text-2xl font-black text-[#0F172A] mt-1">
              Mi Dashboard de Cuponeras
            </h2>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Ingresa tu RUT para consultar el saldo disponible y canjear tus viajes acumulados.
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
              RUT del Titular
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ingresa tu RUT (ej: 12.345.678-K)"
                value={rutInput}
                onChange={(e) => {
                  setRutInput(formatRut(e.target.value));
                  setRutError('');
                }}
                className={`w-full text-sm font-semibold bg-white border rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 ${
                  rutError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-[#F05A24] text-[#0F172A]'
                }`}
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
            </div>
            <p className="text-xs text-[#64748B]">
              Ingresa tu RUT (ej: 12345678-9 o 12345678-K)
            </p>
            {rutError && <p className="text-xs text-red-600 font-bold mt-1">{rutError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !rutInput}
            className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Validar RUT y Consultar Saldo</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ---------------- SEGUNDA INSTANCIA: MOSTRAR DETALLE SÓLO TRAS VALIDACIÓN ---------------- */}
      {searched && (
        <div className="space-y-6 animate-fade-in">
          {/* Tarjetas Consolidadas de Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Cupones Libres</span>
                <span className="text-2xl font-black text-emerald-700">{metricas.disponibles}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0A4DA6] flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Cupones Usados</span>
                <span className="text-2xl font-black text-[#0A4DA6]">{metricas.utilizados}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Cupones Vencidos</span>
                <span className="text-2xl font-black text-amber-700">{metricas.vencidos}</span>
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

          {/* Preferencias de Correo */}
          {cuponeras.length > 0 && (
            <div className="bg-[#FFF7ED] rounded-2xl p-4 border border-[#FFEDD5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F05A24]" />
                <span className="font-medium text-slate-700">
                  Notificaciones enviadas a: <span className="font-bold text-slate-900">{cuponeras[0].emailCliente}</span>
                </span>
              </div>

              {!editingEmail ? (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="text-[#F05A24] font-bold hover:underline cursor-pointer"
                >
                  Cambiar Email
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none"
                  />
                  <button
                    onClick={handleUpdateEmail}
                    className="bg-[#F05A24] text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingEmail(false)}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {emailSuccessMsg && <p className="text-emerald-600 font-bold">{emailSuccessMsg}</p>}
            </div>
          )}

          {/* LISTA DE CUPONERAS ADQUIRIDAS Y SU SALDO (EJ. 8/10) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Cuponeras Adquiridas ({cuponeras.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Resumen de saldo disponible por cuponera activa.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-[#0A4DA6] px-3 py-1 rounded-full border border-blue-200">
                Titular: {rutFormateado}
              </span>
            </div>

            {cuponeras.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-700">No se encontraron cuponeras registradas para este RUT.</p>
                <p>Puedes comprar tu primer paquete de viajes congelados en nuestro Catálogo Oficial.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cuponeras.map((c) => {
                  const totalC = c.totalCupones || 10;
                  const usadosC = c.cuponesUsados || 0;
                  const saldoC = c.saldoDisponible !== undefined ? c.saldoDisponible : (totalC - usadosC);
                  const daysLeft = getDaysLeft(c.fechaVencimiento);
                  
                  // REGLA CLAVE: Botón de canje habilitado SOLO si quedan cupones disponible (>0) y la cuponera está activa
                  const canCanjear = saldoC > 0 && c.estado === 'Activo' && daysLeft > 0;
                  const porcentajeSaldo = Math.round((saldoC / totalC) * 100);

                  return (
                    <div
                      key={c.codigo}
                      className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        canCanjear
                          ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 shadow-sm'
                          : saldoC === 0
                          ? 'border-slate-200 bg-slate-50 opacity-90'
                          : 'border-amber-200 bg-amber-50/20'
                      }`}
                    >
                      {/* Encabezado Cuponera */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-extrabold text-sm text-[#F05A24] bg-white px-3 py-1 rounded-lg border border-[#FFEDD5] shadow-xs">
                            Código: {c.codigo}
                          </span>

                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                              canCanjear
                                ? 'bg-emerald-600 text-white'
                                : saldoC === 0
                                ? 'bg-slate-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {canCanjear ? 'Activa' : saldoC === 0 ? 'Sin Saldo (Agotada)' : 'Vencida'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-base text-slate-900">{c.nombreCuponera}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">Tramos:</span> {c.tramosPermitidos.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* SALDO DE LA CUPONERA (Ej: 8/10 quedan 8 cupones de 10) */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                              Saldo de Cupones
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className={`text-3xl font-black ${saldoC > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {saldoC}
                              </span>
                              <span className="text-sm font-bold text-slate-400">/ {totalC}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-700 block">
                              Quedan <span className="text-[#F05A24] font-extrabold">{saldoC}</span> cupones de {totalC}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">({usadosC} viajes realizados)</span>
                          </div>
                        </div>

                        {/* Barra de Progreso del Saldo */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              saldoC > 3 ? 'bg-emerald-500' : saldoC > 0 ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${porcentajeSaldo}%` }}
                          />
                        </div>
                      </div>

                      {/* Vigencia en Días */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-1">
                        <Clock className="w-4 h-4 text-[#F05A24]" />
                        <span>Vigencia 90 días: Quedan {daysLeft} días (Vence el {new Date(c.fechaVencimiento).toLocaleDateString('es-CL')})</span>
                      </div>

                      {/* BOTÓN CANJEAR: ACTIVADO SOLO CUANDO QUEDE CUPO EN LA CUPONERA */}
                      <button
                        disabled={!canCanjear}
                        onClick={() => onCanjearCupon(c.codigo, rutFormateado)}
                        className={`w-full font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                          canCanjear
                            ? 'bg-[#F05A24] hover:bg-[#D94B18] text-white shadow-md cursor-pointer transform hover:-translate-y-0.5'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                      >
                        {canCanjear ? (
                          <>
                            <span>Canjear Pasaje con esta Cuponera</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : saldoC === 0 ? (
                          <>
                            <Ban className="w-4 h-4 text-slate-400" />
                            <span>Sin Saldo Disponible (0/{totalC} Cupones)</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 text-slate-400" />
                            <span>Cuponera Vencida (Superó 90 días)</span>
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
