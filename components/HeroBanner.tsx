'use client';

import React from 'react';
import { Ticket, ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onGoToCatalog: () => void;
  onGoToDashboard: () => void;
}

export default function HeroBanner({ onGoToCatalog, onGoToDashboard }: HeroBannerProps) {
  return (
    <div className="relative bg-gradient-to-br from-[#FFF7ED] via-white to-[#FFF1F2] rounded-3xl p-8 sm:p-10 mb-8 shadow-sm border border-[#FFEDD5] overflow-hidden">
      {/* Indicadores de Flujo del Portal (Pasos 1-4) */}
      <div className="flex justify-center items-center gap-2 sm:gap-6 mb-8 text-[11px] font-bold text-slate-500 overflow-x-auto pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#F05A24] text-white flex items-center justify-center text-xs font-black shadow-xs">
            1
          </div>
          <span className="text-[#F05A24] font-black">Validación</span>
        </div>
        <span className="text-slate-300">›</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
            2
          </div>
          <span>Búsqueda</span>
        </div>
        <span className="text-slate-300">›</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
            3
          </div>
          <span>Pago</span>
        </div>
        <span className="text-slate-300">›</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
            4
          </div>
          <span>Confirmación</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Izquierdo */}
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#FFF7ED] px-3.5 py-1.5 rounded-full border border-[#FFEDD5] text-xs font-extrabold text-[#F05A24]">
            <Ticket className="w-4 h-4 text-[#F05A24]" />
            <span>Portal Oficial de Cuponeras Digitales</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Bienvenido al <span className="text-[#F05A24]">Portal de Cuponeras</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
            Accede a tarifas exclusivas congeladas durante 90 días con tus cuponeras digitales de viaje. Autogestión 100% en línea mediante validación 2FA.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-[#FFEDD5] shadow-xs">
              <Clock className="w-5 h-5 text-[#F05A24] shrink-0" />
              <span className="text-xs font-bold text-slate-700">90 días de vigencia fija</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-[#FFEDD5] shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700">Validación 2FA por SMS/Email</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white p-3 rounded-2xl border border-[#FFEDD5] shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#F05A24] shrink-0" />
              <span className="text-xs font-bold text-slate-700">19 Cuponeras Oficiales</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={onGoToCatalog}
              className="bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold px-6 py-3.5 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 text-sm sm:text-base cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Ver Catálogo de Cuponeras</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToDashboard}
              className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold px-6 py-3.5 rounded-xl border border-slate-300 transition-all text-sm sm:text-base cursor-pointer shadow-xs"
            >
              <span>Consultar mi Saldo por RUT</span>
            </button>
          </div>
        </div>

        {/* Lado Derecho */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] p-6 rounded-3xl shadow-sm relative space-y-4">
            <div className="flex justify-between items-center">
              <span className="bg-[#F05A24] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Cuponera Oficial
              </span>
              <span className="text-slate-500 text-xs font-bold">Validación por RUT</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#F05A24] uppercase tracking-wider">Cuponera Destacada</span>
              <h3 className="text-xl font-black text-slate-900">Santiago - Viña del Mar</h3>
              <p className="text-2xl font-black text-[#F05A24]">$4.900 <span className="text-xs text-slate-500 font-normal">/ viaje</span></p>
            </div>

            <div className="border-t border-[#FED7AA] pt-3 text-xs text-slate-700 space-y-1.5 font-medium">
              <p>• Válida para 20 viajes ida y vuelta</p>
              <p>• Selección de asiento 2D interactivo</p>
              <p>• Vigencia de 90 días corridos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
