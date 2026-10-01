"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Printer, Download, Bus, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingData } from "@/types/booking";
import { useCuponStore } from "@/lib/cupon-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useReservationStore } from "@/lib/reservation-store";

interface StepConfirmationProps {
  bookingData: BookingData;
  onFinish: () => void;
}

export function StepConfirmation({ bookingData, onFinish }: StepConfirmationProps) {
  const { cuponInfo } = useCuponStore();
  const departureBooking = useReservationStore((state) => state.getDepartureBooking());

  const handlePrint = () => {
    window.print();
  };

  const pnr = bookingData.transactionId || departureBooking?.pnrNumbers?.[0] || "N/A";
  const origen = bookingData.origin || departureBooking?.origin || "N/A";
  const destino = bookingData.destination || departureBooking?.destination || "N/A";
  const asiento = bookingData.selectedSeats?.[0] || departureBooking?.selectedSeats?.[0] || "N/A";
  const dateObj = bookingData.date || (departureBooking?.date ? new Date(departureBooking.date) : null);
  const timeStr = bookingData.departureTime || departureBooking?.dep_time || "N/A";
  const formatBusType = (busType: string | null | undefined): string => {
    if (!busType) return "Estándar";
    const parts = busType.split(",").map((p) => p.trim());
    const ignore = ["2+2", "2+1", "AC", "Video", "WiFi", "Baño"];
    const main = parts.find((p) => !ignore.includes(p));
    return main || parts[0];
  };

  const busTypeStr = bookingData.busType ? formatBusType(bookingData.busType) : (departureBooking?.bus_type ? formatBusType(departureBooking.bus_type) : "N/A");

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in print:max-w-full">
      <div className="text-center space-y-4 print:hidden">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
          ¡Canje Exitoso!
        </h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Tu pasaje ha sido emitido correctamente usando el cupón <span className="font-bold text-primary">{cuponInfo?.codigo}</span>.
        </p>
      </div>

      {/* Boleto (Mismo estilo de TicketModal pero integrado) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6 mx-auto print:shadow-none print:border-none">
        {/* Encabezado Boleto */}
        <div className="text-center space-y-2 border-b border-dashed border-slate-200 pb-4">
          <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
            <Bus className="w-3.5 h-3.5" />
            <span>Pullmanbus Cuponeras</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900">Boleto Electrónico de Viaje</h3>
          <div className="flex justify-center gap-4 text-xs font-mono font-bold text-primary">
            <span>PNR: {pnr}</span>
            {bookingData.gdsData?.operatorPnr && <span>OP: {bookingData.gdsData.operatorPnr}</span>}
          </div>
        </div>

        {/* Cuerpo del Pasaje */}
        <div className="space-y-4 text-sm">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Pasajero</span>
              <span className="font-bold text-slate-900">{bookingData.passengerName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">RUT Titular</span>
              <span className="font-mono font-bold text-slate-900">{bookingData.passengerRut}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-500 font-medium">Cupón Canjeado</span>
              <span className="font-mono font-bold text-primary">{cuponInfo?.codigo}</span>
            </div>
          </div>

          {/* Detalles del Itinerario */}
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Origen</span>
                <span className="text-base font-bold text-slate-900">{origen}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-primary" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Destino</span>
                <span className="text-base font-bold text-slate-900">{destino}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Embarque</span>
                <span className="text-sm font-medium text-slate-800">{bookingData.gdsData?.boardingAt || origen}</span>
                {bookingData.gdsData?.boardingAddress && (
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{bookingData.gdsData.boardingAddress}</span>
                )}
                <span className="text-xs text-slate-500 block mt-1">
                  Salida: <span className="font-bold text-primary">{bookingData.gdsData?.boardingTime || timeStr}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Desembarque</span>
                <span className="text-sm font-medium text-slate-800">{bookingData.gdsData?.dropOffAt || destino}</span>
                {bookingData.gdsData?.dropOffAddress && (
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{bookingData.gdsData.dropOffAddress}</span>
                )}
                {bookingData.gdsData?.arrivalTime && (
                  <span className="text-xs text-slate-500 block mt-1">
                    Llegada: <span className="font-bold text-slate-600">{bookingData.gdsData.arrivalTime}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-100">
              <div>
                <span className="text-xs text-slate-500 block">Fecha del Viaje</span>
                <span className="font-bold">
                  {dateObj && format(dateObj, "dd MMM yyyy", { locale: es })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Asiento N°</span>
                <span className="font-extrabold text-lg text-primary">#{asiento}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 text-slate-600">
              <span>Tipo: {busTypeStr}</span>
            </div>
          </div>

          {/* QR Code */}
          {bookingData.gdsData?.qrCodeUrl && (
            <div className="flex flex-col items-center justify-center pt-2 pb-2">
              <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Presenta este código al abordar</span>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-slate-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    bookingData.gdsData.qrCodeUrl.startsWith("http") || bookingData.gdsData.qrCodeUrl.startsWith("data:")
                      ? bookingData.gdsData.qrCodeUrl
                      : `data:image/png;base64,${bookingData.gdsData.qrCodeUrl}`
                  }
                  alt="Código QR del Pasaje"
                  className="w-32 h-32 object-contain print:w-40 print:h-40"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Pasaje
        </Button>
        <Button onClick={onFinish} className="w-full sm:w-auto">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Volver a Mis Cuponeras
        </Button>
      </div>
    </div>
  );
}
