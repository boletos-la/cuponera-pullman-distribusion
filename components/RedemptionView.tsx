'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { couponService } from '@/lib/services/couponService';
import { getApiUrl } from '@/lib/apiClient';
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

  // Emisión Final
  const [emitidoPasaje, setEmitidoPasaje] = useState<any | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState('');

  // OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showOtpModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOtpModal]);

  useEffect(() => {
    fetch(`${getApiUrl()}/gds/cities`)
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
      // 1. Intentar obtener la información real de la cuponera desde el dashboard del usuario
      try {
        const dashRes = await couponService.getDashboard(rutToValidate);
        if (dashRes && dashRes.success && Array.isArray(dashRes.cupones)) {
          const found = dashRes.cupones.find((c: any) => 
            c.codigo === codeToValidate || 
            c.codigo.replace(/\D/g, '') === codeToValidate.replace(/\D/g, '')
          );
          if (found) {
            setCuponInfo({
              codigo: found.codigo,
              nombreCuponera: found.nombreCuponera,
              tramosPermitidos: found.tramosPermitidos || [],
              fechaVencimiento: found.fechaVencimiento,
              totalCupones: found.totalCupones,
              cuponesUsados: found.cuponesUsados,
              saldoDisponible: found.saldoDisponible
            });
            if (found.tramosPermitidos && found.tramosPermitidos.length > 0) {
              setSelectedTramo(found.tramosPermitidos[0]);
            }
            setValidatingCupon(false);
            return;
          }
        }
      } catch (e) {
        // Fallback al endpoint local si falla la llamada
      }

      // 2. Fallback
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

      const promises = [];
      const baseDate = new Date(); // Start from today
      for (let i = 0; i < 14; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        const params = new URLSearchParams({
          originId: originCity.id.toString(),
          destinationId: destCity.id.toString(),
          date: dateStr,
        });

        promises.push(
          fetch(`${getApiUrl()}/gds/search?${params}`)
            .then(res => res.json())
            .catch(() => ({ error: true }))
        );
      }

      const results = await Promise.all(promises);
      let allServices: KuposService[] = [];
      
      results.forEach(data => {
        if (!data.error && data.services) {
          allServices = [...allServices, ...data.services];
        }
      });

      // Sort services by date and time
      allServices.sort((a, b) => {
        const timeA = new Date(`${a.travel_date}T${a.dep_time || '00:00'}`).getTime();
        const timeB = new Date(`${b.travel_date}T${b.dep_time || '00:00'}`).getTime();
        return timeA - timeB;
      });

      if (allServices.length === 0) {
        setCuponError('No hay salidas disponibles para los próximos 14 días.');
      } else {
        setCuponError('');
        setServicios(allServices);
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
      const res = await fetch(`${getApiUrl()}/gds/service-detail/${srv.id}`);
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

  const handleReserveAndEmit = async () => {
    if (!selectedServicio || !selectedAsiento || !cuponInfo) return;

    setIsProcessing(true);
    setProcessError('');
    try {
      // 1. Reserva tentativa en Kupos
      const seatObj = availableSeats.find(s => s.number === selectedAsiento);
      const boardingPoint = selectedServicio.boarding_stages?.split('|')[0] || '';
      const dropoffPoint = selectedServicio.dropoff_stages?.split('|')[0] || '';

      const bookRes = await fetch(`${getApiUrl()}/gds/reserve`, {
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
        setProcessError(`El asiento ya no está disponible en GDS Kupos. Detalle: ${bookData.error || 'Error desconocido'}`);
        setIsProcessing(false);
        return;
      }

      const generatedPnrNumber = bookData.pnrNumber;
      const generatedOperatorPnr = bookData.operatorPnr;

      setPnrNumber(generatedPnrNumber);
      setOperatorPnr(generatedOperatorPnr);
      setTravelName(bookData.travelName);

      // Instead of confirming directly, send OTP and show modal
      const otpRes = await couponService.sendRedeemOtp(rut);
      if (!otpRes || !otpRes.success) {
        setProcessError(otpRes?.message || 'Error al enviar código OTP. Verifica tu sesión y correo.');
        setIsProcessing(false);
        return;
      }
      
      setShowOtpModal(true);
      setOtpError('');
      setOtpCode('');
    } catch (err: any) {
      setProcessError(err.message || 'Ocurrió un error en la reserva.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmWithOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setOtpError('Ingresa el código de 6 dígitos.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');

    try {
      const [origenStr, destinoStr] = selectedTramo.split('-').map(s => s.trim());
      const seatObj = availableSeats.find(s => s.number === selectedAsiento);

      let rutaId = 1;
      const origenLow = origenStr.toLowerCase();
      const destinoLow = destinoStr.toLowerCase();
      if (origenLow.includes('santiago') && destinoLow.includes('puerto montt')) {
        rutaId = 75;
      } else if (origenLow.includes('puerto montt') && destinoLow.includes('santiago')) {
        rutaId = 76;
      }

      const reservaData = await couponService.redeemCoupon({
        rut,
        idUsuarioCuponera: parseInt(cuponCodigo.replace(/\D/g, '')) || 1,
        idRuta: rutaId,
        otpCode: otpCode,
        pnrNumber: pnrNumber || '',
        operatorPnr: operatorPnr || '',
        travelId: selectedServicio?.travel_id?.toString() || '0',
        origin: origenStr,
        destination: destinoStr,
        seatNumber: selectedAsiento || '',
        travelDate: selectedServicio?.travel_date || selectedFecha,
        fare: seatObj?.price || 0
      } as any);

      if (reservaData.success) {
        setEmitidoPasaje({
          codigo: reservaData.data?.boletoExterno || pnrNumber,
          cuponCodigo: reservaData.data?.codigoCupon || cuponCodigo,
          rutCliente: rut,
          nombreCliente: 'Titular de Cuenta',
          emailCliente: 'cliente@ejemplo.cl',
          servicioId: selectedServicio?.id || 'SRV',
          origen: origenStr,
          destino: destinoStr,
          fechaSalida: selectedServicio?.travel_date || selectedFecha,
          horaSalida: selectedServicio?.dep_time || '00:00',
          asientoNumero: selectedAsiento || 0,
          tipoBus: selectedServicio?.bus_type || 'Bus',
          patente: operatorPnr || 'PNR-OP',
          estado: 'Emitido',
          fechaEmision: new Date().toISOString(),
          codigoQR: 'qr-placeholder',
          codigoBarras: 'barras-placeholder'
        });
        setShowOtpModal(false);
        setShowTicketModal(true);
      } else {
        setOtpError(reservaData.message || 'Código incorrecto o expirado.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Ocurrió un error en el canje final.');
    } finally {
      setIsSendingOtp(false);
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
            Canje de Cupón por Pasaje (1-Clic)
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
                          <div>
                            <span className="font-extrabold text-lg text-slate-900 block">{srv.dep_time} - {srv.arr_time}</span>
                            <span className="text-[10px] font-bold text-[#0A4DA6] uppercase">{new Date(srv.travel_date + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          </div>
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

                    <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div>
                        <span className="text-xs text-slate-900 font-bold block">Asiento Seleccionado: {selectedAsiento}</span>
                        <span className="text-[11px] text-slate-600">Siguiente paso: Reserva tentativa y Emisión.</span>
                      </div>
                      <button
                        onClick={handleReserveAndEmit}
                        disabled={isProcessing}
                        className="w-full sm:w-auto bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isProcessing ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><ShieldCheck className="w-4 h-4 text-white" /><span>Confirmar Reserva y Emitir</span></>
                        )}
                      </button>
                    </div>
                    {processError && (
                      <div className="p-3 mt-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /><span>{processError}</span>
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

      {/* Modal 2FA OTP */}
      {mounted && showOtpModal && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-sm relative animate-fade-in">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4 pt-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-[#0A4DA6]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Validación de Seguridad</h3>
                <p className="text-xs text-slate-500 mt-1">Hemos enviado un código de 6 dígitos a tu correo registrado. Ingresa el código para confirmar el canje.</p>
              </div>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl font-mono tracking-widest font-black bg-slate-50 border border-slate-300 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-[#0A4DA6]/20 focus:border-[#0A4DA6] transition-all"
              />
              {otpError && <p className="text-xs text-red-600 font-bold">{otpError}</p>}
              <button
                onClick={handleConfirmWithOtp}
                disabled={isSendingOtp || otpCode.length < 6}
                className="w-full bg-[#0A4DA6] hover:bg-[#083b82] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSendingOtp ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verificar y Canjear</>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
