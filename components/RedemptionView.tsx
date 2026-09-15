'use client';

import React, { useState, useEffect } from 'react';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { couponService } from '@/lib/services/couponService';
import { Bus, ShieldCheck, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, KeyRound, Ticket, Lock, ArrowRight, UserCheck, X } from 'lucide-react';
import TicketModal from './TicketModal';

interface City {
  id: number;
  name: string;
}

interface KuposService {
  id: number;
  operator_service_name: string;
  origin_id: number;
  destination_id: number;
  route_id: number;
  travel_id: number;
  bus_type: string;
  dep_time: string;
  arr_time: string;
  duration: string;
  available_seats: number;
  cost: string;
  boarding_stages: string;
  dropoff_stages: string;
  travel_date: string;
}

interface KuposSeat {
  number: string;
  price: number;
}

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

  // Datos de Kupos
  const [cities, setCities] = useState<City[]>([]);
  
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
  const [servicios, setServicios] = useState<KuposService[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);

  // Selección de Servicio y Asiento
  const [selectedServicio, setSelectedServicio] = useState<KuposService | null>(null);
  const [selectedAsiento, setSelectedAsiento] = useState<string | null>(null);
  const [availableSeats, setAvailableSeats] = useState<KuposSeat[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  
  // Reserva tentativa
  const [pnrNumber, setPnrNumber] = useState<string | null>(null);
  const [operatorPnr, setOperatorPnr] = useState<string | null>(null);
  const [travelName, setTravelName] = useState<string | null>(null);

  // Modal 2FA OTP
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(300);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Emisión Final
  const [emitidoPasaje, setEmitidoPasaje] = useState<any | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    fetch('/api/kupos/cities')
      .then(res => res.json())
      .then(data => {
        if (data.cities) setCities(data.cities);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (initialCuponCode && initialRut) {
      handleValidateCupon(initialCuponCode, initialRut);
    }
  }, [initialCuponCode, initialRut]);

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
    if (!cuponInfo || !selectedTramo) return;
    setLoadingServicios(true);
    setServicios([]);
    setSelectedServicio(null);
    setSelectedAsiento(null);
    
    try {
      const [origenStr, destinoStr] = selectedTramo.split('-').map(s => s.trim());
      const originCity = cities.find(c => c.name.toLowerCase() === origenStr.toLowerCase());
      const destCity = cities.find(c => c.name.toLowerCase() === destinoStr.toLowerCase());

      if (!originCity || !destCity) {
        setCuponError(`No se pudieron resolver las ciudades en el GDS: ${origenStr} a ${destinoStr}`);
        setLoadingServicios(false);
        return;
      }

      const params = new URLSearchParams({
        originId: originCity.id.toString(),
        destinationId: destCity.id.toString(),
        date: selectedFecha,
      });

      const res = await fetch(`/api/kupos/search?${params}`);
      const data = await res.json();

      if (data.error) {
        setCuponError(data.error);
      } else {
        setServicios(data.services || []);
      }
    } catch (err) {
      console.error(err);
      setCuponError('Error buscando servicios en GDS Kupos.');
    } finally {
      setLoadingServicios(false);
    }
  };

  const handleSelectService = async (srv: KuposService) => {
    setSelectedServicio(srv);
    setSelectedAsiento(null);
    setAvailableSeats([]);
    setLoadingSeats(true);
    
    try {
      const res = await fetch(`/api/kupos/service-detail/${srv.id}`);
      const data = await res.json();
      
      if (data.service && data.service.bus_layout && data.service.bus_layout.available) {
        const seats: KuposSeat[] = [];
        data.service.bus_layout.available.split(',').forEach((seatInfo: string) => {
          const [seatNumber, priceStr] = seatInfo.split('|');
          if (seatNumber && priceStr) {
            seats.push({ number: seatNumber.trim(), price: parseFloat(priceStr.trim()) });
          }
        });
        setAvailableSeats(seats.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleStart2FA = async () => {
    if (!selectedServicio || !selectedAsiento || !cuponInfo) return;

    setGeneratingOtp(true);
    setOtpError('');
    try {
      // 1. Reserva tentativa en Kupos
      const seatObj = availableSeats.find(s => s.number === selectedAsiento);
      const boardingPoint = selectedServicio.boarding_stages?.split('|')[0] || '';
      const dropoffPoint = selectedServicio.dropoff_stages?.split('|')[0] || '';

      const bookRes = await fetch('/api/kupos/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServicio.id.toString(),
          seatNumber: selectedAsiento,
          price: seatObj?.price || 0,
          originId: selectedServicio.origin_id,
          destinationId: selectedServicio.destination_id,
          travelDate: selectedServicio.travel_date,
          busType: selectedServicio.bus_type,
          routeId: selectedServicio.route_id,
          availableSeats: selectedServicio.available_seats,
          cost: selectedServicio.cost,
          boardingAt: boardingPoint,
          dropoffAt: dropoffPoint,
          passengerName: 'Titular de Cuponera',
          passengerEmail: 'correo@reservas.cl', // This should ideally be the real email
          passengerRut: rut,
        })
      });

      const bookData = await bookRes.json();
      if (!bookRes.ok || !bookData.success) {
        setOtpError(`El asiento ya no está disponible en GDS Kupos. Detalle: ${bookData.error || 'Error desconocido'}`);
        setGeneratingOtp(false);
        return;
      }

      setPnrNumber(bookData.pnrNumber);
      setOperatorPnr(bookData.operatorPnr);
      setTravelName(bookData.travelName);

      // 2. Si reserva tentativa ok, solicitar 2FA
      const otpRes = await fetch('/api/coupons/send-redeem-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut })
      });
      const otpData = await otpRes.json();

      if (otpData.success) {
        setOtpTimer(300);
        setShowOtpModal(true);
      } else {
        setOtpError(otpData.message || 'No se pudo generar el código 2FA.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Error conectando con el servicio de autenticación.');
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleVerifyOtpAndEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otpTimer === 0) {
      setOtpError('El token ha expirado. Solicite un nuevo código.');
      return;
    }

    if (!pnrNumber) {
      setOtpError('Error crítico: PNR no encontrado. Reinicie el proceso de canje.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const seatObj = availableSeats.find(s => s.number === selectedAsiento);
      const [origenStr, destinoStr] = selectedTramo.split('-').map(s => s.trim());

      // Llamar al backend para validar OTP y confirmar reserva en DB y GDS
      const reservaRes = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: rut,
          idUsuarioCuponera: parseInt(cuponCodigo.replace(/\D/g, '')) || 1, // Fix mapping CuponCode -> id if needed
          idRuta: 1, // Fallback if necessary
          otpCode: otpCodeInput,
          pnrNumber: pnrNumber,
          operatorPnr: operatorPnr || '',
          travelId: selectedServicio?.travel_id?.toString() || '0',
          origin: origenStr,
          destination: destinoStr,
          seatNumber: selectedAsiento,
          travelDate: selectedFecha,
          fare: seatObj?.price || 0
        })
      });

      const reservaData = await reservaRes.json();

      if (reservaData.success) {
        setShowOtpModal(false);
        setEmitidoPasaje({
          codigo: reservaData.data?.boletoExterno || pnrNumber,
          cuponCodigo: reservaData.data?.codigoCupon || cuponCodigo,
          rutCliente: rut,
          nombreCliente: 'Titular de Cuenta',
          emailCliente: 'cliente@ejemplo.cl',
          servicioId: selectedServicio?.id || 'SRV',
          origen: origenStr,
          destino: destinoStr,
          fechaSalida: selectedFecha,
          horaSalida: selectedServicio?.dep_time || '00:00',
          asientoNumero: selectedAsiento || 0,
          tipoBus: selectedServicio?.bus_type || 'Bus',
          patente: operatorPnr || 'PNR-OP',
          estado: 'Emitido',
          fechaEmision: new Date().toISOString(),
          codigoQR: 'qr-placeholder',
          codigoBarras: 'barras-placeholder'
        });
        setShowTicketModal(true);
      } else {
        setOtpError(reservaData.message || 'Error al emitir el pasaje en el Backend.');
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
            Flujo E2E • Integración Kupos GDS
          </span>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <Bus className="w-5 h-5 text-[#F05A24]" />
            Canje de Cupón por Pasaje (Con Autorización 2FA)
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Ingresa tu código de cupón activo y RUT para buscar viajes en la red Kupos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Código del Cupón *</label>
            <input
              type="text"
              placeholder="ej. 1 (ID de cuponera para dev)"
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
                    Vigente hasta el {new Date(cuponInfo.fechaVencimiento).toLocaleDateString('es-CL')}
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

      {cuponInfo && (
        <div className="space-y-6">
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
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Viaje</label>
                <input
                  type="date"
                  value={selectedFecha}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedFecha(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSearchServicios}
              disabled={loadingServicios}
              className="bg-[#F05A24] hover:bg-[#D94B18] disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {loadingServicios ? "Buscando en Kupos..." : "Actualizar Horarios"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0A4DA6]" />
                Salidas Disponibles ({servicios.length})
              </h3>
              {servicios.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-200">
                  {loadingServicios ? "Cargando..." : "No hay salidas disponibles para la combinación elegida."}
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
                  {servicios.map((srv) => {
                    const isSelected = selectedServicio?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleSelectService(srv)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected ? 'border-[#0A4DA6] bg-blue-50/50 shadow-md ring-2 ring-[#0A4DA6]/20' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-extrabold text-lg text-slate-900">{srv.dep_time} - {srv.arr_time}</span>
                          <span className="text-[10px] font-bold bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">{srv.bus_type}</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p className="font-semibold text-slate-800">{srv.operator_service_name}</p>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-emerald-700 font-bold">{srv.available_seats} Asientos Libres</span>
                            <span className="text-[#0A4DA6] font-bold text-xs">
                              {isSelected ? '✓ Seleccionado' : 'Seleccionar Asiento ➔'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              {selectedServicio ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Selección de Asientos GDS</h3>
                      <p className="text-xs text-slate-500">Salida: {selectedServicio.dep_time} • {selectedTramo}</p>
                    </div>
                  </div>

                  {loadingSeats ? (
                    <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-[#0A4DA6] border-t-transparent rounded-full animate-spin"></div></div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-700 block mb-2">🚌 Asientos Disponibles</span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {availableSeats.length > 0 ? availableSeats.map((a) => {
                            const isSelected = selectedAsiento === a.number;
                            return (
                              <button
                                key={a.number}
                                onClick={() => setSelectedAsiento(a.number)}
                                className={`p-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                                  isSelected
                                    ? 'bg-[#FF6B00] text-white border-orange-600 shadow-md scale-105 ring-2 ring-orange-400'
                                    : 'bg-white text-slate-800 border-emerald-400 hover:bg-emerald-50 hover:border-emerald-600'
                                }`}
                              >
                                <span>{a.number}</span>
                              </button>
                            );
                          }) : (
                            <p className="text-xs text-slate-500 col-span-full text-center">No hay asientos disponibles devueltos por el GDS.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAsiento && (
                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div>
                        <span className="text-xs text-slate-900 font-bold block">Asiento Seleccionado: {selectedAsiento}</span>
                        <span className="text-[11px] text-slate-600">Siguiente paso: Reserva tentativa y Autorización 2FA.</span>
                      </div>
                      <button
                        onClick={handleStart2FA}
                        disabled={generatingOtp}
                        className="w-full sm:w-auto bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {generatingOtp ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><ShieldCheck className="w-4 h-4 text-white" /><span>Solicitar 2FA e Iniciar Canje</span></>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 space-y-2">
                  <Bus className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Selecciona un horario para cargar la disponibilidad real en el GDS.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center"><KeyRound className="w-5 h-5" /></div>
                <div>
                  <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider block">GDS KUPOS</span>
                  <h3 className="text-lg font-black text-slate-900">Autorización 2FA de 6 Dígitos</h3>
                </div>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-xs text-slate-600">
              Reserva tentativa creada exitosamente (PNR: {pnrNumber}). Se ha enviado una clave dinámica a su correo. Ingrésela a continuación para confirmar la emisión.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-600">Vigencia del Token:</span>
              <span className={`font-mono font-black text-base ${otpTimer < 60 ? 'text-red-600 animate-pulse' : 'text-[#0A4DA6]'}`}>
                {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')} min
              </span>
            </div>

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
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /><span>{otpError}</span>
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
                  <><ShieldCheck className="w-5 h-5 text-[#FF6B00]" /><span>Confirmar Reserva Kupos y Emitir</span></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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
