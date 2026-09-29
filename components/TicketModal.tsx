'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pasaje } from '@/lib/dataStore';
import { Printer, Download, CheckCircle, X, Bus, Calendar, MapPin, QrCode, LayoutDashboard } from 'lucide-react';

interface TicketModalProps {
  pasaje: Pasaje;
  onClose: () => void;
}

export default function TicketModal({ pasaje, onClose }: TicketModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-fade-in print:shadow-none print:border-none print:max-w-full">
        {/* Botón Cerrar (Oculto en Impresión) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Boleto */}
        <div className="text-center space-y-2 border-b border-dashed border-slate-200 pb-4">
          <div className="inline-flex items-center gap-1.5 bg-[#fa5e00] text-white px-3 py-1 rounded-full text-xs font-black uppercase shadow-xs">
            <Bus className="w-3.5 h-3.5 text-white" />
            <span>Pullmanbus Cuponeras</span>
          </div>

          <h3 className="text-xl font-black text-slate-900">Boleto Electrónico de Viaje</h3>
          <p className="text-xs font-mono font-bold text-[#fa5e00]">Código: {pasaje.codigo}</p>
        </div>

        {/* Cuerpo del Pasaje */}
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Pasajero</span>
              <span className="font-bold text-slate-900">{pasaje.nombreCliente}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">RUT Titular</span>
              <span className="font-mono font-bold text-slate-900">{pasaje.rutCliente}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Cupón Canjeado</span>
              <span className="font-mono font-bold text-[#023caf]">{pasaje.cuponCodigo}</span>
            </div>
          </div>

          {/* Detalles del Itinerario */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Origen</span>
                <span className="text-sm font-extrabold text-slate-900">{pasaje.origen}</span>
              </div>

              <span className="text-base font-black text-[#FF6B00]">➔</span>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Destino</span>
                <span className="text-sm font-extrabold text-slate-900">{pasaje.destino}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-500 block">Fecha y Hora</span>
                <span className="font-bold">{pasaje.fechaSalida} a las {pasaje.horaSalida} hrs</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Asiento N°</span>
                <span className="font-extrabold text-base text-[#FF6B00]">Asiento #{pasaje.asientoNumero}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] pt-1 text-slate-600">
              <span>Tipo: {pasaje.tipoBus}</span>
              <span>Bus Patente: <span className="font-mono font-bold">{pasaje.patente}</span></span>
            </div>
          </div>

          {/* Código QR y Código de Barras */}
          <div className="text-center pt-2 space-y-2">
            <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              {/* Image element embedding QR code */}
              <img
                src={
                  pasaje.codigoQR.startsWith("http") || pasaje.codigoQR.startsWith("data:")
                    ? pasaje.codigoQR
                    : `data:image/png;base64,${pasaje.codigoQR}`
                }
                alt={`QR Pasaje ${pasaje.codigo}`}
                className="w-36 h-36 mx-auto object-contain"
              />
            </div>
            <div className="font-mono text-center text-xs font-bold text-slate-700 tracking-widest">
              {pasaje.codigoBarras}
            </div>
          </div>
        </div>

        {/* Pie y Acciones (Oculto al Imprimir) */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full bg-[#fa5e00] hover:bg-[#e55400] text-white font-bold py-3 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-[#fa5e00]" />
            <span>Volver a Mis cuponeras</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
