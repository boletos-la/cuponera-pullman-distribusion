"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Printer, Download, Bus, ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingData } from "@/types/booking";
import { useCuponStore } from "@/lib/cupon-store";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StepConfirmationProps {
  bookingData: BookingData;
  onFinish: () => void;
}

export function StepConfirmation({ bookingData, onFinish }: StepConfirmationProps) {
  const { cuponInfo } = useCuponStore();

  const handlePrint = () => {
    window.print();
  };

  const pnr = bookingData.transactionId || "N/A";
  const origen = bookingData.origin;
  const destino = bookingData.destination;
  const asiento = bookingData.selectedSeats[0] || "N/A";

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
          <p className="text-xs font-mono font-bold text-primary">PNR: {pnr}</p>
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
                <span className="text-xs text-slate-500 block">Fecha y Hora</span>
                <span className="font-bold">
                  {bookingData.date && format(bookingData.date, "dd MMM yyyy", { locale: es })} a las {bookingData.departureTime}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Asiento N°</span>
                <span className="font-extrabold text-lg text-primary">#{asiento}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 text-slate-600">
              <span>Tipo: {bookingData.busType}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Pasaje
        </Button>
        <Button onClick={onFinish} className="w-full sm:w-auto">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
