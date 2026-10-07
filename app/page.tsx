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
import { ShieldCheck, Bus, Heart, ArrowUp, Mail, MapPin } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  let activeTab = 'catalogo';
  let selectedRut = '';
  let selectedCuponCode = '';

  const qParam = searchParams.get('q');
  if (qParam) {
    try {
      const decoded = JSON.parse(atob(qParam));
      if (decoded.tab) activeTab = decoded.tab;
      if (decoded.rut) selectedRut = decoded.rut;
      if (decoded.cupon) selectedCuponCode = decoded.cupon;
    } catch (e) {
      console.error("Invalid URL payload");
    }
  } else {
    // Fallback por compatibilidad
    activeTab = searchParams.get('tab') || 'catalogo';
    selectedRut = searchParams.get('rut') || '';
    selectedCuponCode = searchParams.get('cupon') || '';
  }

  const [showExceptionModal, setShowExceptionModal] = useState<boolean>(false);
  const [showScroll, setShowScroll] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateUrl = (tab: string, rut?: string, cupon?: string) => {
    const payload: any = { tab };
    
    // Si rut es explícitamente definido y no es vacío, agregarlo
    if (rut !== undefined && rut !== '') {
      payload.rut = rut;
    }
    
    // Si cupon es explícitamente definido y no es vacío, agregarlo
    if (cupon !== undefined && cupon !== '') {
      payload.cupon = cupon;
    }
    
    // Encriptación simple con base64 para ocultar los datos en la URL
    const encrypted = btoa(JSON.stringify(payload));
    router.replace(`${pathname}?q=${encrypted}`, { scroll: false });
    
    // Al igual que en Navbar, forzar el scroll arriba de forma suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                <div className="absolute top-0 left-0 w-full h-2 bg-[#ff6700]" />
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
      <footer id="contacto" className="bg-[#1a1a1a] text-white pt-16 relative overflow-hidden border-t border-neutral-800 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 space-y-6">
              <a href="/" className="inline-block">
                <img
                  src="/logo-boletos.png"
                  alt="Boletos.la Logo"
                  width={150}
                  height={80}
                  className="transition-transform duration-300 hover:scale-105 brightness-0 invert"
                  loading="eager"
                />
              </a>
            </div>

            {/* Quick Links Column */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                DESCUBRE
              </h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                {["Hoteles", "Terminales", "Guías de viaje", "Blog"].map((link, idx) => (
                  <li key={idx}>
                    <a href="#" className="hover:text-white transition-colors no-underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Links Column */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                BOLETOS.LA
              </h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                {["Sobre nosotros", "Prensa", "Trabaja con nosotros", "Ayuda", "Contacto"].map((link, idx) => (
                  <li key={idx}>
                    <a href="#" className="hover:text-white transition-colors no-underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trust & Payment Badges Bar */}
        <div className="py-6 border-t border-white/10 relative z-10 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left: Payment Logos */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {["Google Pay", "Apple Pay", "Webpay", "Transbank"].map((gateway, idx) => (
                  <div key={idx} className="h-8 px-3 border border-white/20 rounded flex items-center bg-white/5 text-xs font-semibold whitespace-nowrap text-white">
                    {gateway}
                  </div>
                ))}
              </div>

              {/* Right: Security & Trust Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-8">
                {/* Google Safe Browsing */}
                <div className="flex items-center gap-2 select-none">
                  <svg className="w-[37.8px] h-[37.8px]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2C24.5 4.5 30 7.5 30 11.5C30 20.5 24.5 28.5 18 33C11.5 28.5 6 20.5 6 11.5C6 7.5 11.5 4.5 18 2Z" fill="#34A853" />
                    <circle cx="18" cy="17" r="6.5" fill="white" />
                    <circle cx="18" cy="15.5" r="3" fill="#34A853" />
                    <path d="M15.5 15.5H20.5L19.5 21.5H16.5L15.5 15.5Z" fill="#34A853" />
                    <circle cx="18" cy="15.5" r="1.5" fill="white" />
                    <path d="M18 17V20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col leading-none">
                    <div className="flex items-center text-[19.85px] font-bold tracking-tight">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">o</span>
                      <span className="text-[#FBBC05]">o</span>
                      <span className="text-[#4285F4]">g</span>
                      <span className="text-[#34A853]">l</span>
                      <span className="text-[#EA4335]">e</span>
                    </div>
                    <span className="text-[12.5px] font-medium text-white/60 whitespace-nowrap">
                      Safe browsing
                    </span>
                  </div>
                </div>

                {/* SSL 100% Secure Purchase */}
                <div className="flex items-center gap-2 select-none">
                  <svg className="w-[37.8px] h-[37.8px]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2C24.5 4.5 30 7.5 30 11.5C30 20.5 24.5 28.5 18 33C11.5 28.5 6 20.5 6 11.5C6 7.5 11.5 4.5 18 2Z" fill="#10B981" />
                    <g transform="translate(0, 1)">
                      <text x="18" y="14" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">SSL</text>
                      <rect x="13.5" y="17" width="9" height="6.5" rx="1.2" fill="white" />
                      <path d="M15.5 17V15.5C15.5 14.1 16.6 13 18 13C19.4 13 20.5 14.1 20.5 15.5V17" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                    </g>
                  </svg>
                  <div className="flex flex-col leading-none">
                    <span className="text-[19.85px] font-bold text-white tracking-tight">100%</span>
                    <span className="text-[12.5px] font-medium text-white/60 whitespace-nowrap">Secure purchase</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-white/50 text-sm">
                <img
                  src="/logo-boletos.png"
                  alt="Boletos.la"
                  width={90}
                  height={24}
                  className="object-contain brightness-0 invert opacity-50"
                />
                <span className="hidden md:inline">|</span>
                <span>Todos los derechos reservados.</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                <a href="#" className="hover:text-white transition-colors">Terminos y condiciones</a>
                <span>|</span>
                <a href="#" className="hover:text-white transition-colors">Política de privacidad</a>
              </div>
            </div>
          </div>
        </div>

        {showScroll && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 w-12 h-12 bg-[#ff6700] text-white rounded-md flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-md h-8 w-8 border-b-2 border-primary"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
