"use client";

import React from "react";
import { Printer, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingData } from "@/types/booking";
import { useCuponStore } from "@/lib/cupon-store";
import { format } from "date-fns";

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

  const renderQr = () => {
    if (!bookingData.gdsData?.qrCodeUrl) return null;
    const src = bookingData.gdsData.qrCodeUrl.startsWith("http") || bookingData.gdsData.qrCodeUrl.startsWith("data:")
      ? bookingData.gdsData.qrCodeUrl
      : `data:image/png;base64,${bookingData.gdsData.qrCodeUrl}`;
    return (
      <div className="flex flex-col items-center border border-slate-300 p-3 w-40 h-48 bg-white">
        <span className="text-[10px] font-bold text-slate-500 mb-1">CÓDIGO QR</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Código QR" className="w-full h-full object-contain" />
      </div>
    );
  };

  return (
    <div className="max-w-[700px] mx-auto animate-fade-in print:max-w-full print:p-0 font-sans text-slate-800">
      
      {/* Mensaje superior (Oculto al imprimir) */}
      <div className="text-center space-y-3 mb-6 print:hidden">
        <h2 className="text-3xl font-bold text-green-600">¡Canje Exitoso!</h2>
        <p className="text-slate-600">Tu boleto ha sido emitido. Puedes imprimirlo o descargarlo.</p>
      </div>

      {/* TICKET CONTAINER - Estilo similar al PDF */}
      <div className="bg-white border border-slate-300 shadow-md p-8 print:shadow-none print:border-none mx-auto w-full relative">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
          <div>
            <h4 className="text-xs text-slate-500 tracking-wider font-semibold">BOLETO ELECTRÓNICO DE VIAJE</h4>
            <div className="mt-2 text-[10px] text-slate-500 space-y-1">
              <p>Este documento es válido como pasaje.</p>
              <p>Presente este boleto junto a su cédula de identidad al abordar.</p>
            </div>
          </div>
          <div className="w-48 text-right">
             <img src="/logo_pullman.png" alt="Pullman Bus Logo" className="w-full h-auto opacity-90 object-contain" />
          </div>
        </div>

        {/* Sección Datos del Pasajero & QR */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1 space-y-4">
            
            <div>
              <h5 className="text-[#ff6600] font-bold text-sm mb-2 border-b border-slate-200 pb-1">DATOS DEL PASAJERO</h5>
              <div className="border border-slate-400 p-4 space-y-2 text-xs">
                <div className="flex"><span className="w-32 font-bold">Nombre:</span> <span>{bookingData.passengerName}</span></div>
                <div className="flex"><span className="w-32 font-bold">RUT:</span> <span>{bookingData.passengerRut}</span></div>
                <div className="flex"><span className="w-32 font-bold">N° Boleto (PNR):</span> <span className="font-bold">{pnr}</span></div>
                <div className="flex"><span className="w-32 font-bold">Empresa:</span> <span>Pullman Bus</span></div>
                <div className="flex"><span className="w-32 font-bold">Convenio:</span> <span>Cuponera Digital</span></div>
              </div>
            </div>

            <div>
              <h5 className="text-[#ff6600] font-bold text-sm mb-2 border-b border-slate-200 pb-1">DATOS DEL SERVICIO</h5>
              <div className="border border-slate-400 p-4 space-y-2 text-xs">
                <div className="flex"><span className="w-32 font-bold">Origen:</span> <span>{origen}</span></div>
                <div className="flex"><span className="w-32 font-bold">Destino:</span> <span>{destino}</span></div>
                <div className="flex"><span className="w-32 font-bold">Fecha de Viaje:</span> <span>{dateObj && format(dateObj, "dd/MM/yyyy")}</span></div>
                <div className="flex"><span className="w-32 font-bold">Hora Salida:</span> <span>{timeStr}</span></div>
                <div className="flex"><span className="w-32 font-bold">N° Asiento:</span> <span className="font-bold text-sm">{asiento}</span></div>
              </div>
            </div>

          </div>
          
          <div className="shrink-0 flex items-center justify-center pt-8">
            {renderQr()}
          </div>
        </div>

        {/* Información de Pago */}
        <div className="mb-6 flex justify-between items-center border-t border-b border-slate-300 py-3">
          <div>
            <h5 className="text-[#ff6600] font-bold text-sm">INFORMACIÓN DE PAGO</h5>
            <p className="text-xs text-slate-600 mt-1">Canje mediante cupón: <span className="font-bold">{cuponInfo?.codigo}</span></p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold mr-4">Total Pagado:</span>
            <span className="text-xl font-black">$0</span>
          </div>
        </div>

        {/* Disclaimer Legal */}
        <div className="text-[10px] text-slate-500 text-justify leading-relaxed bg-slate-50 p-4 border border-slate-200">
          <ul className="space-y-2 list-none pl-4 relative">
            <li className="before:content-['•'] before:absolute before:-left-4 before:text-[#ff6600] before:font-bold">
              Cada pasajero tendrá derecho a treinta kilogramos (30 kg) de equipaje, sólo si su volumen no excede los 180 decímetros cúbicos (Art. 68). En caso del equipaje exceda 5 UTM, es responsabilidad del pasajero declararlo en las sucursales de ventas, a lo menos con 1 hora de antelación de la salida del bus.
            </li>
            <li className="before:content-['•'] before:absolute before:-left-4 before:text-[#ff6600] before:font-bold">
              En viajes de más de dos (2) horas, el pasajero debe entregar la información necesaria para evitar un sumario sanitario, según lo indica la Resolución Exenta 644/2021 del Ministerio de Salud.
            </li>
            <li className="before:content-['•'] before:absolute before:-left-4 before:text-[#ff6600] before:font-bold">
              Es responsabilidad del pasajero contar con la documentación necesaria estipulada por el Gobierno de Chile.
            </li>
            <li className="before:content-['•'] before:absolute before:-left-4 before:text-[#ff6600] before:font-bold">
              Para viajes internacionales los itinerarios están sujetos a cambios sin previo aviso o suspensión por condición climática adversa o restricciones sanitarias.
            </li>
          </ul>
        </div>
      </div>

      {/* Botones de Acción (Ocultos al imprimir) */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto font-bold border-slate-300">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Pasaje
        </Button>
        <Button onClick={onFinish} className="w-full sm:w-auto font-bold bg-[#fa5e00] hover:bg-[#fa5e00]/90 text-white">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Volver a Mis Cuponeras
        </Button>
      </div>
    </div>
  );
}
