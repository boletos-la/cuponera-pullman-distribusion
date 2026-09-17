"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, Bus, Calendar, Clock, MapPin, User, Loader2, AlertCircle } from "lucide-react";
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
        fare: departureBooking.totalPrice || bookingData.tripPrice,
        kuposEnv: process.env.NEXT_PUBLIC_KUPOS_ENV || 'dev'
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          Confirmación de Canje
        </h2>
        <p className="text-slate-500">
          Revisa los detalles antes de canjear tu cupón
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <h3 className="font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Cupón a Utilizar: {cuponInfo.codigo}
          </h3>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-slate-500" /> Detalle del Viaje
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Origen</span>
                <span className="font-medium">{displayOrigin}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Destino</span>
                <span className="font-medium">{displayDestination}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Fecha</span>
                <span className="font-medium">
                  {displayDate && format(displayDate, "dd MMM yyyy", { locale: es })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Horario</span>
                <span className="font-medium">{displayDepartureTime} - {displayArrivalTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Asiento(s)</span>
                <span className="font-bold text-primary">{displaySelectedSeats.join(", ")}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Pasajero
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Nombre Completo</span>
                <span className="font-medium">{bookingData.passengerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">RUT</span>
                <span className="font-medium">{bookingData.passengerRut}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Email E-Ticket</span>
                <span className="font-medium">{bookingData.passengerEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={onBack} disabled={isProcessing} className="w-full sm:w-32">
          Volver
        </Button>
        <Button onClick={handleConfirmRedemption} disabled={isProcessing || !displaySelectedSeats.length} className="w-full sm:w-auto min-w-[200px]">
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando Canje...</>
          ) : (
            <><Ticket className="mr-2 h-4 w-4" /> Confirmar Canje de Cupón</>
          )}
        </Button>
      </div>
    </div>
  );
}
