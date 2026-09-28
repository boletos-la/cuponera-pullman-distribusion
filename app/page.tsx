'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CatalogView from '@/components/CatalogView';
import DashboardView from '@/components/DashboardView';
import { RedemptionFlow } from '@/components/redemption/RedemptionFlow';
import TicketCancellationView from '@/components/TicketCancellationView';
import AdminMaintainer from '@/components/AdminMaintainer';
import ExceptionSimulator from '@/components/ExceptionSimulator';
import { ShieldCheck, Bus, Heart } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('catalogo');
  const [selectedRut, setSelectedRut] = useState<string>('');
  const [selectedCuponCode, setSelectedCuponCode] = useState<string>('');
  const [showExceptionModal, setShowExceptionModal] = useState<boolean>(false);

  const handleGoToDashboardWithRut = (rut: string) => {
    setSelectedRut(rut);
    setActiveTab('dashboard');
  };

  const handleGoToCanjeWithCupon = (cupon: string, rut: string) => {
    setSelectedCuponCode(cupon);
    setSelectedRut(rut);
    setActiveTab('canje');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navbar Cabecera */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'dashboard') {
            // Al hacer clic en Mi Dashboard desde la barra de navegación,
            // se limpia el RUT en memoria para mostrar siempre el buscador público limpio
            setSelectedRut('');
          }
          setActiveTab(tab);
        }}
        onOpenExceptionModal={() => setShowExceptionModal(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner Hero desplegado en la vista de Catálogo */}
        {activeTab === 'catalogo' && (
          <HeroBanner
            onGoToCatalog={() => setActiveTab('catalogo')}
            onGoToDashboard={() => {
              setSelectedRut('');
              setActiveTab('dashboard');
            }}
          />
        )}

        {/* Renderizado Dinámico de Vistas */}
        <div className="transition-all duration-300">
          {activeTab === 'catalogo' && (
            <CatalogView
              onGoToDashboardWithRut={handleGoToDashboardWithRut}
              onGoToCanjeWithCupon={handleGoToCanjeWithCupon}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              initialRut={selectedRut}
              onCanjearCupon={(codigo, rut) => {
                setSelectedCuponCode(codigo);
                setSelectedRut(rut);
                setActiveTab('canje');
              }}
              onResetRut={() => setSelectedRut('')}
            />
          )}

          {activeTab === 'canje' && (
            <RedemptionFlow
              initialCuponCode={selectedCuponCode}
              initialRut={selectedRut}
              onFinishRedemption={(rut) => handleGoToDashboardWithRut(rut)}
              onBack={() => {
                if (selectedRut) {
                  handleGoToDashboardWithRut(selectedRut);
                } else {
                  setActiveTab('dashboard');
                }
              }}
            />
          )}

          {activeTab === 'anulacion' && <TicketCancellationView />}
        </div>
      </main>

      {/* Modal Simulador de Excepciones */}
      {showExceptionModal && (
        <ExceptionSimulator
          onClose={() => setShowExceptionModal(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Pie de Página Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-12 relative overflow-hidden">
        {/* Elemento de diseño de fondo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#023caf] via-[#fa5e00] to-[#023caf]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#023caf]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#fa5e00]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 border-b border-slate-800/80 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#023caf] to-[#011a4f] text-white flex items-center justify-center font-black text-2xl shadow-lg border border-[#023caf]/50">
                P
              </div>
              <div>
                <h3 className="font-extrabold text-xl tracking-tight text-white">
                  PULLMAN <span className="text-[#fa5e00]">BUS</span>
                </h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Cuponeras Digitales</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                    Desarrollado por WIT SPA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seguridad</span>
                  <span className="text-sm font-extrabold text-white">2FA Activa</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-[#fa5e00]/10 flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5 text-[#fa5e00]" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cobertura</span>
                  <span className="text-sm font-extrabold text-white">Cuponeras Oficiales</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-medium text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Pullman Bus Cuponeras / WIT SPA. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-[#fa5e00] transition-colors">Términos y Condiciones</a>
              <span className="text-slate-700">•</span>
              <a href="#" className="hover:text-[#fa5e00] transition-colors">Política de Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
