'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CatalogView from '@/components/CatalogView';
import DashboardView from '@/components/DashboardView';
import ProfileTab from '@/components/ProfileTab';
import { RedemptionFlow } from '@/components/redemption/RedemptionFlow';
import TicketCancellationView from '@/components/TicketCancellationView';
import AdminMaintainer from '@/components/AdminMaintainer';
import ExceptionSimulator from '@/components/ExceptionSimulator';
import { ShieldCheck, Bus, Heart } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab = searchParams.get('tab') || 'catalogo';
  const selectedRut = searchParams.get('rut') || '';
  const selectedCuponCode = searchParams.get('cupon') || '';
  const [showExceptionModal, setShowExceptionModal] = useState<boolean>(false);

  const updateUrl = (tab: string, rut?: string, cupon?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    
    if (rut !== undefined) {
      if (rut) params.set('rut', rut);
      else params.delete('rut');
    }
    
    if (cupon !== undefined) {
      if (cupon) params.set('cupon', cupon);
      else params.delete('cupon');
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleGoToDashboardWithRut = (rut: string) => {
    updateUrl('dashboard', rut);
  };

  const handleGoToCanjeWithCupon = (cupon: string, rut: string) => {
    updateUrl('canje', rut, cupon);
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
            updateUrl(tab, '');
          } else {
            updateUrl(tab);
          }
        }}
        onOpenExceptionModal={() => setShowExceptionModal(true)}
      />

      {/* Banner Hero desplegado en la vista de Catálogo */}
      {activeTab === 'catalogo' && (
        <HeroBanner
          onGoToCatalog={() => updateUrl('catalogo')}
          onGoToDashboard={() => updateUrl('dashboard', '')}
        />
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">

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
              onCanjearCupon={(codigo, rut) => handleGoToCanjeWithCupon(codigo, rut)}
              onResetRut={() => updateUrl('dashboard', '')}
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
                  updateUrl('dashboard');
                }
              }}
            />
          )}

          {activeTab === 'anulacion' && <TicketCancellationView />}

          {activeTab === 'perfil' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#fa5e00]" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Mis Datos de Perfil</h2>
                <p className="text-sm text-slate-500 font-medium mb-8">
                  Gestiona la seguridad y el correo asociado a tu cuenta.
                </p>
                <ProfileTab />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Simulador de Excepciones */}
      {showExceptionModal && (
        <ExceptionSimulator
          onClose={() => setShowExceptionModal(false)}
          onNavigateTab={(tab) => updateUrl(tab)}
        />
      )}

      {/* Pie de Página Footer */}
      <footer className="bg-[#023caf] text-white py-12 mt-12 relative overflow-hidden">
        {/* Elementos de diseño de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 border-b border-white/20 pb-8">
            <div className="flex flex-col">
              <div className="flex items-center">
                <img 
                  src="/logo-pullman-beneficios-blanco.png" 
                  alt="Pullmanbus Cuponeras" 
                  width={200} 
                  height={60} 
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-blue-200 uppercase tracking-wider">Seguridad</span>
                  <span className="text-sm font-extrabold text-white">2FA Activa</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-blue-200 uppercase tracking-wider">Cobertura</span>
                  <span className="text-sm font-extrabold text-white">Cuponeras Oficiales</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-medium text-blue-200 gap-4">
            <p>© {new Date().getFullYear()} Pullman Bus Cuponeras / WIT SPA. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
              <span className="text-white/30">•</span>
              <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
