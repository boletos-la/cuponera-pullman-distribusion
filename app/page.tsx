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
      <footer className="bg-slate-900 text-white border-t border-slate-800 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A4DA6] text-white flex items-center justify-center font-black text-xl">
                P
              </div>
              <div>
                <span className="font-extrabold text-lg text-white">PULLMAN </span>
                <span className="font-extrabold text-lg text-[#FF6B00]">COSTA CENTRAL</span>
                <p className="text-xs text-slate-400">Sistema de Cuponeras Digitales • WIT SPA</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Seguridad 2FA Activa
              </span>
              <span className="flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-[#FF6B00]" />
                19 Cuponeras Oficiales
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
            <p>© 2026 Pullman Costa Central / WIT SPA. Todos los derechos reservados.</p>

          </div>
        </div>
      </footer>
    </div>
  );
}
