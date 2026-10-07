'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onGoToCatalog: () => void;
  onGoToDashboard: () => void;
}

export default function HeroBanner({ onGoToCatalog, onGoToDashboard }: HeroBannerProps) {
  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api').replace('/api', '');
    return `${baseUrl}${url}`;
  };

  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/admin/config?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data.bannerUrl) {
          setBannerUrl(data.data.bannerUrl);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-24 bg-slate-50 min-h-[300px]">
        <div className="animate-spin rounded-md h-12 w-12 border-b-2 border-[#00c7cc]"></div>
      </div>
    );
  }

  if (bannerUrl) {
    return (
      <div className="w-full bg-slate-100 relative">
        <img 
          src={getFullImageUrl(bannerUrl)} 
          alt="Portal de Cuponeras" 
          className="w-full h-auto max-h-[600px] object-cover object-center block"
        />
        {/* Transición de Fade hacia el contenido inferior */}
        <div className="absolute bottom-0 left-0 w-full h-24 md:h-48 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
      <div className="relative bg-[#023caf] rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden border-0 bg-cover bg-center">
        <div className="absolute inset-0 overflow-hidden bg-[#023caf] rounded-3xl">
          <span className="wave-span wave-1" />
          <span className="wave-span wave-2" />
          <span className="wave-span wave-3" />
        </div>
        
        {/* Indicadores de Flujo del Portal (Pasos 1-4) */}
        <div className="relative z-10 flex justify-center items-center gap-2 sm:gap-6 mb-8 text-[11px] font-bold text-white/60 overflow-x-auto pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00c7cc] text-white flex items-center justify-center text-xs font-black shadow-xs">
              1
            </div>
            <span className="text-white font-black">Validación</span>
          </div>
          <span className="text-white/40">›</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <span>Búsqueda</span>
          </div>
          <span className="text-white/40">›</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span>Pago</span>
          </div>
          <span className="text-white/40">›</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 text-white flex items-center justify-center text-xs font-bold">
              4
            </div>
            <span>Confirmación</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Lado Izquierdo */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-md border border-white/20 text-xs font-bold text-white backdrop-blur-sm">
              <Ticket className="w-4 h-4 text-[#00c7cc]" />
              <span>Portal Oficial de Cuponeras Digitales</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
              Bienvenido al <span className="text-[#00c7cc]">Portal de Cuponeras</span>
            </h1>

            <p className="text-white/90 text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
              Accede a tarifas exclusivas congeladas durante 90 días con tus cuponeras digitales de viaje. Autogestión 100% en línea mediante validación 2FA.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-lg border border-white/20 shadow-xs backdrop-blur-sm">
                <Clock className="w-5 h-5 text-[#00c7cc] shrink-0" />
                <span className="text-xs font-bold text-white">90 días de vigencia fija</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-lg border border-white/20 shadow-xs backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white">Validación 2FA por SMS/Email</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-lg border border-white/20 shadow-xs backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-[#00c7cc] shrink-0" />
                <span className="text-xs font-bold text-white">19 Cuponeras Oficiales</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={onGoToCatalog}
                className="bg-[#00c7cc] hover:bg-[#00c7cc]/90 text-white font-bold px-6 py-3.5 rounded-md shadow-lg transition-transform flex items-center gap-2 text-sm sm:text-base cursor-pointer transform hover:scale-105"
              >
                <span>Ver Catálogo de Cuponeras</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToDashboard}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-md border border-white/30 transition-transform text-sm sm:text-base cursor-pointer backdrop-blur-sm transform hover:scale-105 shadow-lg"
              >
                <span>Consultar mi Saldo por RUT</span>
              </button>
            </div>
          </div>

          {/* Lado Derecho */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="bg-white/10 border border-white/20 p-6 rounded-3xl shadow-xl relative space-y-4 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <span className="bg-[#00c7cc] text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider">
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
                <div className="w-full bg-white/20 rounded-md h-1.5">
                  <div className="bg-[#00c7cc] h-1.5 rounded-md w-full"></div>
                </div>
              </div>
              
              <div className="pt-2 text-[10px] text-white/60 font-medium text-center">
                * Ejemplo de tarifa referencial
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
