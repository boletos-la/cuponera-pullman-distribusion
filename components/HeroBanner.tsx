'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onGoToCatalog: () => void;
  onGoToDashboard: () => void;
}

export default function HeroBanner({ onGoToCatalog, onGoToDashboard }: HeroBannerProps) {
  const [bannerUrl, setBannerUrl] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/admin/config?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data.bannerUrl) {
          setBannerUrl(data.data.bannerUrl);
        }
      } catch (e) {}
    };
    fetchConfig();
  }, []);

  return (
    <div 
      className="relative bg-[#023caf] rounded-3xl p-8 sm:p-10 mb-8 shadow-2xl overflow-hidden border-0 bg-cover bg-center"
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}
    >
      {!bannerUrl && (
        <div className="absolute inset-0 overflow-hidden bg-[#023caf] rounded-3xl">
          <span className="wave-span wave-1" />
          <span className="wave-span wave-2" />
          <span className="wave-span wave-3" />
        </div>
      )}
      
      {/* Overlay Oscuro para el Banner */}
      {bannerUrl && <div className="absolute inset-0 bg-black/40 rounded-3xl pointer-events-none" />}

      {/* Indicadores de Flujo del Portal (Pasos 1-4) */}
      <div className="relative z-10 flex justify-center items-center gap-2 sm:gap-6 mb-8 text-[11px] font-bold text-white/60 overflow-x-auto pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#fa5e00] text-white flex items-center justify-center text-xs font-black shadow-xs">
            1
          </div>
          <span className="text-white font-black">Validación</span>
        </div>
        <span className="text-white/40">›</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
            2
          </div>
          <span>Búsqueda</span>
        </div>
        <span className="text-white/40">›</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
            3
          </div>
          <span>Pago</span>
        </div>
        <span className="text-white/40">›</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
            4
          </div>
          <span>Confirmación</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Izquierdo */}
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white backdrop-blur-sm">
            <Ticket className="w-4 h-4 text-[#fa5e00]" />
            <span>Portal Oficial de Cuponeras Digitales</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
            Bienvenido al <span className="text-[#fa5e00]">Portal de Cuponeras</span>
          </h1>

          <p className="text-white/90 text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
            Accede a tarifas exclusivas congeladas durante 90 días con tus cuponeras digitales de viaje. Autogestión 100% en línea mediante validación 2FA.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xs backdrop-blur-sm">
              <Clock className="w-5 h-5 text-[#fa5e00] shrink-0" />
              <span className="text-xs font-bold text-white">90 días de vigencia fija</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xs backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-white">Validación 2FA por SMS/Email</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-2xl border border-white/20 shadow-xs backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-[#fa5e00] shrink-0" />
              <span className="text-xs font-bold text-white">19 Cuponeras Oficiales</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={onGoToCatalog}
              className="bg-[#fa5e00] hover:bg-[#fa5e00]/90 text-white font-bold px-6 py-3.5 rounded-full shadow-lg transition-transform flex items-center gap-2 text-sm sm:text-base cursor-pointer transform hover:scale-105"
            >
              <span>Ver Catálogo de Cuponeras</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToDashboard}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-full border border-white/30 transition-transform text-sm sm:text-base cursor-pointer backdrop-blur-sm transform hover:scale-105 shadow-lg"
            >
              <span>Consultar mi Saldo por RUT</span>
            </button>
          </div>
        </div>

        {/* Lado Derecho */}
        <div className="lg:col-span-4 hidden lg:block">
          <div className="bg-white/10 border border-white/20 p-6 rounded-3xl shadow-xl relative space-y-4 backdrop-blur-md">
            <div className="flex justify-between items-center">
              <span className="bg-[#fa5e00] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Cuponera Oficial
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            
            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-3xl font-black text-white">$45.000</span>
              <span className="text-sm font-bold text-white/70">/6 pasajes</span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold text-white">
                <span>Ruta Preferente</span>
                <span className="text-white/80">Santiago - Viña</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-[#fa5e00] h-1.5 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="pt-2 text-[10px] text-white/60 font-medium text-center">
              * Ejemplo de tarifa referencial
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
