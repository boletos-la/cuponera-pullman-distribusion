"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, Bus, Calendar, Clock, MapPin, User, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BookingData } from "@/types/booking";
import { couponService } from "@/lib/services/couponService";
import { useReservationStore } from "@/lib/reservation-store";

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

  const handleConfirmRedemption = async () => {
    const departureBooking = useReservationStore.getState().getDepartureBooking();
    if (!departureBooking?.selectedSeats?.length) return;
    
    setIsProcessing(true);
    setErrorMsg("");
    try {
      const selectedAsiento = departureBooking?.selectedSeats[0] || "";

      // Obtener el PNR reservado en el paso anterior desde el store
      const generatedPnrNumber = departureBooking?.pnrNumbers?.[0];
      const generatedOperatorPnr = departureBooking?.pnrNumbersTicket?.[0];

      if (!generatedPnrNumber) {
        setErrorMsg("No se encontró el PNR de la reserva. Vuelve al paso anterior e intenta nuevamente.");
        setIsProcessing(false);
        return;
      }

      // 2. Confirmación final en DB y GDS (sin OTP real)
      let rutaId = 1;
      const origin = departureBooking.origin || bookingData.origin;
      const destination = departureBooking.destination || bookingData.destination;
      const origenLow = origin.toLowerCase();
      const destinoLow = destination.toLowerCase();
      if (origenLow.includes('santiago') && destinoLow.includes('puerto montt')) rutaId = 75;
      else if (origenLow.includes('puerto montt') && destinoLow.includes('santiago')) rutaId = 76;

      const reservaData = await couponService.redeemCoupon({
        idUsuarioCuponera: parseInt(cuponInfo.codigo.replace(/\D/g, '')) || 1,
        idRuta: rutaId,
        otpCode: '000000', 
        pnrNumber: generatedPnrNumber,
        operatorPnr: generatedOperatorPnr || '',
        travelId: bookingData.travelId?.toString() || '0',
        origin: origin,
        destination: destination,
        seatNumber: selectedAsiento,
        travelDate: departureBooking.date ? format(new Date(departureBooking.date), "yyyy-MM-dd") : "",
        fare: departureBooking.totalPrice || bookingData.tripPrice
      });

      if (reservaData.success) {
        // Save the transaction id / external ticket
        updateBookingData({
          transactionId: reservaData.data?.boletoExterno || generatedPnrNumber,
          paymentStatus: "completed"
        });
        onNext();
      } else {
        setErrorMsg(reservaData.message || 'Error al emitir el pasaje en el Backend.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error procesando el canje.');
    } finally {
      setIsProcessing(false);
    }
  };

  const departureBooking = useReservationStore((state) => state.getDepartureBooking());
  const displayOrigin = departureBooking?.origin || bookingData.origin;
  const displayDestination = departureBooking?.destination || bookingData.destination;
  const displayDate = departureBooking?.date ? new Date(departureBooking.date) : bookingData.date;
  const displayDepartureTime = departureBooking?.dep_time || bookingData.departureTime;
  const displayArrivalTime = departureBooking?.arr_time || bookingData.arrivalTime;
  const displaySelectedSeats = departureBooking?.selectedSeats || bookingData.selectedSeats;

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
              <h3 className="font-bold text-xl tracking-wide">{cuponInfo.codigo}</h3>
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

              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
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
                <span className="font-mono font-bold text-slate-800 text-base">{bookingData.passengerRut}</span>
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
          onClick={handleConfirmRedemption} 
          disabled={isProcessing || !displaySelectedSeats.length} 
          className="w-full sm:w-auto px-10 py-6 text-base font-bold text-white bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl rounded-xl transition-all min-w-[240px]"
        >
          {isProcessing ? (
            <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Procesando Canje...</>
          ) : (
            <><Ticket className="mr-3 h-5 w-5" /> Confirmar Canje de Cupón</>
          )}
        </Button>
      </div>
    </div>
  );
}
