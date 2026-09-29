"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Ticket, Bus, Calendar, Clock, MapPin, User, Loader2, AlertCircle, ChevronRight, KeyRound, ShieldCheck, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BookingData } from "@/types/booking";
import { couponService } from "@/lib/services/couponService";
import { useReservationStore } from "@/lib/reservation-store";
import { EmissionLoader } from "@/components/ui/custom-loaders";

interface StepCanjeProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
  cuponInfo: any;
}

export function StepCanje({
  bookingData,
  updateBookingData,
  onNext,
  onBack,
  cuponInfo,
}: StepCanjeProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Estados del modal de validación 2FA (OTP)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccessMsg, setOtpSuccessMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showOtpModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOtpModal]);

  const userRut = bookingData.passengerRut || cuponInfo?.rutUsuario || "";

  // 1. Paso inicial: Solicitar código OTP al correo del usuario y abrir modal
  const handleInitiateCanje = async () => {
    const departureBooking = useReservationStore.getState().getDepartureBooking();
    if (!departureBooking?.selectedSeats?.length) return;

    const generatedPnrNumber = departureBooking?.pnrNumbers?.[0];
    if (!generatedPnrNumber) {
      setErrorMsg("No se encontró el PNR de la reserva. Vuelve al paso anterior e intenta nuevamente.");
      return;
    }

    if (!userRut) {
      setErrorMsg("No se encontró el RUT del pasajero o titular.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");
    setOtpError("");
    setOtpSuccessMsg("");

    try {
      const otpRes = await couponService.sendRedeemOtp(userRut);
      if (!otpRes || !otpRes.success) {
        setErrorMsg(otpRes?.message || "Error al enviar código OTP. Verifica que el RUT esté registrado.");
        setIsProcessing(false);
        return;
      }

      setOtpCode("");
      setShowOtpModal(true);
      setOtpSuccessMsg("Hemos enviado un código de 6 dígitos a tu correo registrado.");
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al solicitar el código 2FA.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Reenviar código OTP
  const handleResendOtp = async () => {
    if (!userRut) return;
    setIsResendingOtp(true);
    setOtpError("");
    setOtpSuccessMsg("");

    try {
      const res = await couponService.sendRedeemOtp(userRut);
      if (res && res.success) {
        setOtpSuccessMsg("Nuevo código 2FA enviado a tu correo.");
      } else {
        setOtpError(res?.message || "Error al reenviar código.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Error al reenviar el código.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  // 3. Confirmación final con OTP ingresado
  const handleConfirmWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError("Por favor ingresa el código OTP de 6 dígitos.");
      return;
    }

    const departureBooking = useReservationStore.getState().getDepartureBooking();
    if (!departureBooking?.selectedSeats?.length) return;

    setIsSubmittingOtp(true);
    setOtpError("");

    try {
      const selectedAsiento = departureBooking?.selectedSeats[0] || "";
      const generatedPnrNumber = departureBooking?.pnrNumbers?.[0] || "";
      const generatedOperatorPnr = departureBooking?.pnrNumbersTicket?.[0] || "";

      let rutaId = 1;
      const origin = departureBooking.origin || bookingData.origin;
      const destination = departureBooking.destination || bookingData.destination;
      const origenLow = origin.toLowerCase();
      const destinoLow = destination.toLowerCase();
      if (origenLow.includes("santiago") && destinoLow.includes("puerto montt")) rutaId = 75;
      else if (origenLow.includes("puerto montt") && destinoLow.includes("santiago")) rutaId = 76;

      const cuponeraId = cuponInfo?.idUsuarioCuponera || parseInt(cuponInfo?.codigo?.replace(/\D/g, "") || "1") || 1;

      const reservaData = await couponService.redeemCoupon({
        rut: userRut,
        idUsuarioCuponera: cuponeraId,
        idRuta: rutaId,
        otpCode: otpCode.trim(),
        pnrNumber: generatedPnrNumber,
        operatorPnr: generatedOperatorPnr,
        travelId: (departureBooking?.travel_id || bookingData.travelId || "0").toString(),
        origin: origin,
        destination: destination,
        seatNumber: selectedAsiento,
        travelDate: departureBooking.date ? format(new Date(departureBooking.date), "yyyy-MM-dd") : "",
        fare: departureBooking.realPrice || departureBooking.totalPrice || bookingData.tripPrice || 0,
        busType: departureBooking?.bus_type || bookingData.busType || "Clásico",
      });

      if (reservaData.success) {
        updateBookingData({
          transactionId: reservaData.data?.boletoExterno || generatedPnrNumber,
          paymentStatus: "completed",
          gdsData: reservaData.data?.gdsData,
        });
        setShowOtpModal(false);
        onNext();
      } else {
        setOtpError(reservaData.message || "Error al canjear el cupón.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Ocurrió un error procesando el canje con el código proporcionado.");
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const departureBooking = useReservationStore((state) => state.getDepartureBooking());
  const displayOrigin = departureBooking?.origin || bookingData.origin;
  const displayDestination = departureBooking?.destination || bookingData.destination;
  const displayDate = departureBooking?.date ? new Date(departureBooking.date) : bookingData.date;
  const displayDepartureTime = departureBooking?.dep_time || bookingData.departureTime;
  const displayArrivalTime = departureBooking?.arr_time || bookingData.arrivalTime;
  const displaySelectedSeats = departureBooking?.selectedSeats || bookingData.selectedSeats;
  const displayBusType = departureBooking?.bus_type || bookingData.busType || "Pullman Costa";

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Ticket className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
          Confirmación de Canje
        </h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Revisa detalladamente tu viaje antes de aplicar tu cupón.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
        {/* Banner Superior de Cupón */}
        <div className="bg-gradient-to-r from-primary/90 to-primary text-white p-5 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider mb-0.5">Cupón a Aplicar</p>
              <h3 className="font-bold text-xl tracking-wide">{cuponInfo?.codigo}</h3>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
              Costo: $0
            </span>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          {/* Tarjeta Detalle de Viaje */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Bus className="w-32 h-32" />
            </div>

            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg border-b border-slate-200 pb-3">
              <div className="bg-blue-100 p-1.5 rounded-md">
                <Bus className="w-5 h-5 text-blue-600" />
              </div>
              Detalle del Viaje
            </h4>

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block mb-1">Origen</span>
                  <span className="font-bold text-slate-900 text-lg">{displayOrigin}</span>
                </div>
                <div className="flex-1 px-4 flex items-center justify-center text-slate-300">
                  <div className="h-px bg-slate-300 w-full"></div>
                  <ChevronRight className="w-5 h-5 mx-2 text-slate-400" />
                  <div className="h-px bg-slate-300 w-full"></div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block mb-1">Destino</span>
                  <span className="font-bold text-slate-900 text-lg">{displayDestination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-medium text-xs block">Fecha</span>
                    <span className="font-bold text-slate-700">
                      {displayDate && format(displayDate, "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-medium text-xs block">Horario</span>
                    <span className="font-bold text-slate-700">{displayDepartureTime}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 col-span-2 pt-3 mt-1 border-t border-slate-100">
                  <Bus className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-medium text-xs block">Tipo de Bus</span>
                    <span className="font-bold text-slate-700 capitalize">{displayBusType.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-between border border-primary/10">
                <span className="text-slate-600 font-medium">Asiento(s) Seleccionado(s)</span>
                <div className="flex gap-2">
                  {displaySelectedSeats.map((s: string) => (
                    <span key={s} className="bg-primary text-white font-bold text-sm px-3 py-1 rounded-md shadow-sm">
                      #{s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Pasajero */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg border-b border-slate-200 pb-3">
              <div className="bg-emerald-100 p-1.5 rounded-md">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              Datos del Pasajero
            </h4>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Nombre Completo</span>
                <span className="font-bold text-slate-800 text-base">{bookingData.passengerName}</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">RUT Titular</span>
                <span className="font-mono font-bold text-slate-800 text-base">{userRut}</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Email para E-Ticket</span>
                <span className="font-medium text-slate-800 text-base">{bookingData.passengerEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-r-xl mb-8 shadow-sm flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-800 mb-1">Ocurrió un problema</h4>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full sm:w-auto px-8 py-6 text-base font-semibold text-slate-600 hover:text-slate-900 border-2 rounded-xl transition-all"
        >
          Regresar
        </Button>
        <Button
          onClick={handleInitiateCanje}
          disabled={isProcessing || !displaySelectedSeats.length}
          className="w-full sm:w-auto px-10 py-6 text-base font-bold text-white bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl rounded-xl transition-all min-w-[240px]"
        >
          {isProcessing ? (
            <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Enviando código 2FA...</>
          ) : (
            <><ShieldCheck className="mr-3 h-5 w-5" /> Validar y Canjear</>
          )}
        </Button>
      </div>

      {/* Modal de Validación 2FA (OTP) */}
      {mounted && showOtpModal && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {isSubmittingOtp && <EmissionLoader message="Confirmando código y emitiendo boleto electrónico..." />}
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-fade-in relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Validación de Seguridad</h3>
                  <p className="text-xs text-slate-500">Autorización 2FA para canje de cupón</p>
                </div>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Ingresa el código de 6 dígitos enviado al correo registrado para el RUT{" "}
                <span className="font-bold text-slate-800">{userRut}</span>.
              </p>

              {otpSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmWithOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-[0.4em] font-mono text-2xl font-black bg-slate-50 border-2 border-slate-300 rounded-2xl py-3 focus:outline-none focus:border-primary focus:bg-white transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingOtp || otpCode.length < 6}
                  className="w-full py-6 text-base font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmittingOtp ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verificando y emitiendo...</>
                  ) : (
                    <><Ticket className="mr-2 h-5 w-5" /> Confirmar y Emitir Boleto</>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResendingOtp}
                    className="text-primary hover:underline font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResendingOtp ? "animate-spin" : ""}`} />
                    <span>{isResendingOtp ? "Reenviando..." : "¿No recibiste el código? Reenviar"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
