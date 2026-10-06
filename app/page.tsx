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
      <footer className="border-t border-border bg-[#023caf] px-4 py-12 lg:px-8 mt-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Logo + tagline + social */}
            <div className="flex flex-col gap-5 md:col-span-1">
              <a href="/">
                <img
                  src="/logo-pullman-beneficios-blanco.png"
                  alt="Pullman Cuponeras"
                  width={200}
                  height={60}
                  className="h-10 w-auto object-contain hover:scale-105 transition-transform"
                />
              </a>
              <p className="text-white/50 text-sm leading-relaxed">
                Accede a tus beneficios de cuponera y viaja con descuentos
                exclusivos en todo Chile.
              </p>
              {/* Social inline bajo el logo */}
              <div className="flex items-center gap-4">
                <a href="https://instagram.com/pullmanbus" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://facebook.com/pullmanbus" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://www.linkedin.com/company/pullman-bus/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
              </div>
            </div>

            {/* Spacer vacío en md para empujar las 3 columnas a la derecha */}
            <div className="hidden md:block" />

            {/* Contacto */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Contacto
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                  <span>
                    <span className="block text-white/40 text-xs mb-0.5">
                      Otras consultas
                    </span>
                    <a
                      href="mailto:clientes@pullmanbus.cl"
                      className="hover:text-white transition-colors"
                    >
                      clientes@pullmanbus.cl
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/40" />
                  <span>
                    <span className="block text-white/40 text-xs mb-0.5">
                      Casa matriz
                    </span>
                    San Borja 235, Estación Central, Santiago
                  </span>
                </li>
              </ul>
            </div>

            {/* Pullman Bus */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                Pullman Bus
              </h3>
              <ul className="space-y-2">
                {[
                  { label: "Conoce tus derechos", href: "/conoce-tus-derechos" },
                  { label: "Políticas de privacidad", href: "/politicas-de-privacidad" },
                  { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-white/70 text-sm hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} Portal de cuponeras de Pullman Bus.
              Todos los derechos reservados.
            </p>
            <p className="text-white/40 text-sm">
              Desarrollado por{" "}
              <a
                href="https://wit.la"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-secondary transition-colors hover:underline"
              >
                WIT.la
              </a>
            </p>
          </div>
        </div>
        {/* Scroll to top */}
        {showScroll && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 z-50"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
