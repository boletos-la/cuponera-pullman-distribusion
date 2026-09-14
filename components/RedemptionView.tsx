'use client';

import React, { useState, useEffect } from 'react';
import { Servicio, Asiento, Pasaje } from '@/lib/dataStore';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { couponService } from '@/lib/services/couponService';
import { Bus, ShieldCheck, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, KeyRound, Ticket, Lock, ArrowRight, UserCheck, X } from 'lucide-react';
import TicketModal from './TicketModal';

interface RedemptionViewProps {
  initialCuponCode?: string;
  initialRut?: string;
  onFinishRedemption?: (rut: string) => void;
}

export default function RedemptionView({ initialCuponCode = '', initialRut = '', onFinishRedemption }: RedemptionViewProps) {
  const [cuponCodigo, setCuponCodigo] = useState(initialCuponCode);
  const [rut, setRut] = useState(initialRut ? formatRut(initialRut) : '');
  const [rutError, setRutError] = useState('');
  const [validatingCupon, setValidatingCupon] = useState(false);
  const [cuponError, setCuponError] = useState('');

  // Datos de la Cuponera Validada
  const [cuponInfo, setCuponInfo] = useState<{
    codigo: string;
    nombreCuponera: string;
    tramosPermitidos: string[];
    fechaVencimiento: string;
    totalCupones?: number;
    cuponesUsados?: number;
    saldoDisponible?: number;
  } | null>(null);

  // Búsqueda de Servicios
  const [selectedTramo, setSelectedTramo] = useState<string>('');
  const [selectedFecha, setSelectedFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);

  // Selección de Servicio y Asiento
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [selectedAsiento, setSelectedAsiento] = useState<number | null>(null);

  // Modal 2FA OTP (Pasos 11 y 12)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpSimuladoTest, setOtpSimuladoTest] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 300s (5 min)
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpValidado, setOtpValidado] = useState(false);

  // Emisión Final
  const [emitidoPasaje, setEmitidoPasaje] = useState<Pasaje | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    if (initialCuponCode && initialRut) {
      handleValidateCupon(initialCuponCode, initialRut);
    }
  }, [initialCuponCode, initialRut]);

  // Cuenta regresiva del 2FA (300 segundos)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setOtpError('El token 2FA ha expirado (validez de 300s agotada). Por favor solicite un nuevo código.');
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // Paso 9: Validar Cupón y Buscar Servicios Compatibles
  const handleValidateCupon = async (codeToValidate: string, rutToValidate: string) => {
    setCuponError('');
    setRutError('');
    const cleanedRut = cleanRut(rutToValidate);

    if (!validateRut(cleanedRut)) {
      setRutError('RUT inválido según el algoritmo Módulo 11.');
      return;
    }

    setValidatingCupon(true);
    try {
      const res = await fetch(`/api/servicios?cuponCodigo=${encodeURIComponent(codeToValidate)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setCuponError(data.error || 'El cupón no es válido o no está disponible.');
        setCuponInfo(null);
        return;
      }

      setCuponInfo(data.cuponValido);
      setServicios(data.servicios);
      if (data.cuponValido.tramosPermitidos.length > 0) {
        setSelectedTramo(data.cuponValido.tramosPermitidos[0]);
      }
    } catch (err) {
      setCuponError('Error de conexión con el servidor.');
    } finally {
      setValidatingCupon(false);
    }
  };

  const handleSearchServicios = async () => {
    if (!cuponInfo) return;
    setLoadingServicios(true);
    try {
      const url = `/api/servicios?cuponCodigo=${cuponInfo.codigo}&tramo=${encodeURIComponent(selectedTramo)}&fecha=${selectedFecha}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setServicios(data.servicios);
      } else {
        setCuponError(data.error || 'No se encontraron salidas.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServicios(false);
    }
  };

  // Solicitar OTP de 2FA (Paso 11)
  const handleStart2FA = async () => {
    if (!selectedServicio || !selectedAsiento || !cuponInfo) return;

    setGeneratingOtp(true);
    setOtpError('');
    try {
      const res = await couponService.sendRedeemOtp();

      if (res.success) {
        setOtpTimer(300);
        setShowOtpModal(true);
      } else {
        setOtpError(res.message || 'No se pudo generar el código 2FA.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Error conectando con el servicio de autenticación.');
    } finally {
      setGeneratingOtp(false);
    }
  };

  // Validar OTP de 2FA y Emitir Pasaje (Pasos 12, 13 y 14)
  const handleVerifyOtpAndEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otpTimer === 0) {
      setOtpError('El token ha expirado. Solicite un nuevo código.');
      return;
    }

    setVerifyingOtp(true);
    try {
      // Intentar canje directamente (el backend valida el OTP y descuenta saldo transaccionalmente)
      const reservaRes = await couponService.redeemCoupon({
        idUsuarioCuponera: parseInt(cuponCodigo), // Asumimos que initialCuponCode es el ID
        idRuta: 1, // Hardcoded temporal hasta integrar el GDS real
        otpCode: otpCodeInput
      });

      if (reservaRes.success) {
        setOtpValidado(true);
        setShowOtpModal(false);
        // El backend devuelve { cupon: { codigo, estado, fecha_uso } }
        setEmitidoPasaje({
          codigo: reservaRes.data.cupon.codigo,
          cuponCodigo: cuponCodigo,
          rutCliente: rut,
          nombreCliente: 'Titular de Cuenta',
          emailCliente: otpEmail || 'cliente@ejemplo.cl',
          servicioId: selectedServicio?.id || 'SRV-000',
          origen: selectedServicio?.origen || 'Origen',
          destino: selectedServicio?.destino || 'Destino',
          fechaSalida: selectedFecha,
          horaSalida: selectedServicio?.horaSalida || '00:00',
          asientoNumero: selectedAsiento || 0,
          tipoBus: selectedServicio?.tipoBus || 'Semi Cama',
          patente: selectedServicio?.patente || 'XXXX-00',
          estado: 'Emitido',
          fechaEmision: new Date().toISOString(),
          codigoQR: 'qr-placeholder',
          codigoBarras: 'barras-placeholder'
        });
        setShowTicketModal(true);
      } else {
        setOtpError(reservaRes.message || 'Error al emitir el pasaje.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Ocurrió un error en la autenticación y emisión.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Paso 9: Encabezado y Formulario de Validación de Cupón */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div>
          <span className="bg-[#FFF7ED] text-[#F05A24] border border-[#FFEDD5] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Flujo E2E • Pasos 9 al 14
          </span>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <Bus className="w-5 h-5 text-[#F05A24]" />
            Canje de Cupón por Pasaje (Con Autorización 2FA)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Ingresa tu código de cupón activo y RUT para habilitar la selección restringida de tramos y asientos del bus.
          </p>
        </div>

        {/* Inputs de Cupón y RUT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Código del Cupón *</label>
            <input
              type="text"
              placeholder="ej. CUP-VNA-9482"
              value={cuponCodigo}
              onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
              className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">RUT del Titular * (Módulo 11)</label>
            <input
              type="text"
              placeholder="12.345.678-K"
              value={rut}
              onChange={(e) => {
                setRut(formatRut(e.target.value));
                setRutError('');
              }}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleValidateCupon(cuponCodigo, rut)}
              disabled={validatingCupon || !cuponCodigo || !rut}
              className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {validatingCupon ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Validar Cupón y Buscar</span>
              )}
            </button>
          </div>
        </div>

        {rutError && <p className="text-xs text-red-600 font-medium">{rutError}</p>}

        {cuponError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{cuponError}</span>
          </div>
        )}

        {/* Banner de Cuponera Validada */}
        {cuponInfo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    Cuponera Válida: {cuponInfo.codigo} ({cuponInfo.nombreCuponera})
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Vigente hasta el {new Date(cuponInfo.fechaVencimiento).toLocaleDateString('es-CL')} (90 días)
                  </span>
                </div>
              </div>

              {cuponInfo.saldoDisponible !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Saldo Disponible</span>
                  <span className="text-sm font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {cuponInfo.saldoDisponible} / {cuponInfo.totalCupones || 10} cupones
                  </span>
                </div>
              )}
            </div>

            {/* Restricción Estricta de Tramo */}
            <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-emerald-100 space-y-1">
              <span className="font-bold text-[#F05A24]">Filtro Estricto de Tramo Autorizado por Contrato:</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {cuponInfo.tramosPermitidos.map((t) => (
                  <span key={t} className="bg-[#F05A24] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paso 10: Buscador de Servicios Restringido y Mapa Interactivo de Bus */}
      {cuponInfo && (
        <div className="space-y-6">
          {/* Barra de Filtro de Salida */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tramo Contratado</label>
                <select
                  value={selectedTramo}
                  onChange={(e) => setSelectedTramo(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-[#F05A24] focus:outline-none"
                >
                  {cuponInfo.tramosPermitidos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Viaje</label>
                <input
                  type="date"
                  value={selectedFecha}
                  onChange={(e) => setSelectedFecha(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSearchServicios}
              className="bg-[#F05A24] hover:bg-[#D94B18] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Actualizar Horarios
            </button>
          </div>

          {/* Lista de Salidas de Bus */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lista de Horarios (Lado Izquierdo) */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0A4DA6]" />
                Salidas Disponibles ({servicios.length})
              </h3>

              {servicios.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-200">
                  No hay salidas disponibles para la combinación elegida.
                </div>
              ) : (
                servicios.map((srv) => {
                  const isSelected = selectedServicio?.id === srv.id;
                  const libres = srv.asientos.filter((a) => a.estado === 'Disponible').length;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => {
                        setSelectedServicio(srv);
                        setSelectedAsiento(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0A4DA6] bg-blue-50/50 shadow-md ring-2 ring-[#0A4DA6]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-extrabold text-lg text-slate-900">{srv.horaSalida} hrs</span>
                        <span className="text-[10px] font-bold bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                          {srv.tipoBus}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600">
                        <p className="font-semibold text-slate-800">{srv.origen} ➔ {srv.destino}</p>
                        <p className="text-[11px] text-slate-400">Bus Patente: {srv.patente} • Código: {srv.codigoServicio}</p>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-emerald-700 font-bold">{libres} Asientos Libres</span>
                          <span className="text-[#0A4DA6] font-bold text-xs hover:underline">
                            {isSelected ? '✓ Seleccionado' : 'Seleccionar Asiento ➔'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* MAPA INTERACTIVO 2D DE ASIENTOS DEL BUS (Lado Derecho) */}
            <div className="lg:col-span-7">
              {selectedServicio ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Mapa Interactivo de Asientos - Bus {selectedServicio.patente}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Salida: {selectedServicio.horaSalida} hrs • {selectedServicio.origen} a {selectedServicio.destino}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-semibold">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-white border-2 border-emerald-500" />
                        <span>Libre</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-[#FF6B00]" />
                        <span>Tu Selección</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-slate-300" />
                        <span>Ocupado</span>
                      </div>
                    </div>
                  </div>

                  {/* Visualizador 2D Piso 1 y Piso 2 */}
                  <div className="space-y-4">
                    {/* Piso 1 (Salón Cama) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        🚌 Piso 1: Salón Cama (Asientos 1 al 12)
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {selectedServicio.asientos
                          .filter((a) => a.piso === 1)
                          .map((a) => {
                            const isOcupado = a.estado !== 'Disponible';
                            const isSelected = selectedAsiento === a.numero;

                            return (
                              <button
                                key={a.numero}
                                disabled={isOcupado}
                                onClick={() => setSelectedAsiento(a.numero)}
                                className={`p-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                                  isSelected
                                    ? 'bg-[#FF6B00] text-white border-orange-600 shadow-md scale-105 ring-2 ring-orange-400'
                                    : isOcupado
                                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed line-through'
                                    : 'bg-white text-slate-800 border-emerald-400 hover:bg-emerald-50 hover:border-emerald-600'
                                }`}
                              >
                                <span>N° {a.numero}</span>
                                <span className="text-[9px] opacity-80">{a.tipo}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Piso 2 (Semi Cama) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-2">
                        🚌 Piso 2: Semi Cama (Asientos 13 al 44)
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {selectedServicio.asientos
                          .filter((a) => a.piso === 2)
                          .map((a) => {
                            const isOcupado = a.estado !== 'Disponible';
                            const isSelected = selectedAsiento === a.numero;

                            return (
                              <button
                                key={a.numero}
                                disabled={isOcupado}
                                onClick={() => setSelectedAsiento(a.numero)}
                                className={`p-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                                  isSelected
                                    ? 'bg-[#FF6B00] text-white border-orange-600 shadow-md scale-105 ring-2 ring-orange-400'
                                    : isOcupado
                                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed line-through'
                                    : 'bg-white text-slate-800 border-emerald-400 hover:bg-emerald-50 hover:border-emerald-600'
                                }`}
                              >
                                <span>N° {a.numero}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Selección y Continuar a 2FA */}
                  {selectedAsiento && (
                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div>
                        <span className="text-xs text-slate-900 font-bold block">
                          Asiento Seleccionado: N° {selectedAsiento}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          Siguiente paso: Autenticación obligatoria mediante 2FA (Pasos 11 y 12).
                        </span>
                      </div>

                      <button
                        onClick={handleStart2FA}
                        disabled={generatingOtp}
                        className="w-full sm:w-auto bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {generatingOtp ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-white" />
                            <span>Solicitar Token 2FA e Iniciar Canje</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
                  <Bus className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Selecciona un horario de la izquierda para desplegar el mapa 2D de asientos del bus.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL DE AUTENTICACIÓN 2FA (PASOS 11 Y 12) ---------------- */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider block">Requerimiento Sección 10</span>
                  <h3 className="text-lg font-black text-slate-900">Autorización 2FA de 6 Dígitos</h3>
                </div>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Se ha enviado una clave dinámica de 6 dígitos a su correo electrónico. Ingrésela a continuación antes de que expire la sesión.
            </p>

            {/* Contador de Tiempo 300 segundos */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">Vigencia del Token:</span>
              <span className={`font-mono font-black text-base ${otpTimer < 60 ? 'text-red-600 animate-pulse' : 'text-[#0A4DA6]'}`}>
                {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')} min
              </span>
            </div>

            {/* TARJETA DE ASISTENTE DE PRUEBA EN PANTALLA */}
            {otpSimuladoTest && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-1">
                <span className="text-[11px] font-extrabold text-[#0A4DA6] block">
                  💡 Asistente de Prueba (Evaluación en Pantalla):
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Código 2FA generado:</span>
                  <button
                    type="button"
                    onClick={() => setOtpCodeInput(otpSimuladoTest)}
                    className="font-mono text-base font-black text-[#FF6B00] bg-white px-2.5 py-0.5 rounded border border-orange-300 hover:bg-orange-50 cursor-pointer"
                  >
                    {otpSimuladoTest} (Haz clic para autorellenar)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndEmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ingresa el Código 2FA *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest font-mono text-2xl font-black bg-slate-50 border border-slate-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-[#0A4DA6]"
                />
              </div>

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingOtp || otpCodeInput.length !== 6 || otpTimer === 0}
                className="w-full bg-[#0A4DA6] hover:bg-blue-900 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
              >
                {verifyingOtp ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-[#FF6B00]" />
                    <span>Validar 2FA y Emitir Pasaje</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PASAJE ELECTRÓNICO EMITIDO (PASOS 13 Y 14) */}
      {showTicketModal && emitidoPasaje && (
        <TicketModal
          pasaje={emitidoPasaje}
          onClose={() => {
            setShowTicketModal(false);
            setCuponInfo(null);
            setCuponCodigo('');
            if (onFinishRedemption) {
              onFinishRedemption(rut);
            }
          }}
        />
      )}
    </div>
  );
}
