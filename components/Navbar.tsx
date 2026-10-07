'use client';

import React from 'react';
import { ShoppingCart, LayoutDashboard, RotateCcw, ShieldAlert, Trash2, User, LogOut, LogIn } from 'lucide-react';
import { getAuthToken, removeAuthToken, getAuthUser } from '@/lib/apiClient';
import { fixEncoding } from '@/lib/utils';
import toast from 'react-hot-toast';
import LoginModal from './LoginModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenExceptionModal: () => void;
}

export default function Navbar({ activeTab, setActiveTab, onOpenExceptionModal }: NavbarProps) {
  const navItems = [
    { id: 'catalogo', label: 'Catálogo Cuponeras', icon: ShoppingCart },
    { id: 'dashboard', label: 'Mis Cuponeras', icon: LayoutDashboard },
    { id: 'anulacion', label: 'Anular Pasaje', icon: RotateCcw },
  ];

  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const handleAuthChange = () => {
      setUser(getAuthUser());
    };
    handleAuthChange();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    removeAuthToken();
    handleTabChange('catalogo');
    setShowLogoutConfirm(false);
    toast.success('Sesión cerrada con éxito');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-neutral-800 shadow-xs">
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => {
            handleTabChange('catalogo');
          }}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner border border-red-100 mb-6">
              <LogOut className="w-8 h-8 ml-1" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Tu sesión actual será finalizada. Tendrás que ingresar nuevamente para acceder a tus cuponeras.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-4 rounded-md transition-all shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] active:scale-[0.98]"
              >
                Sí, cerrar sesión
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-md transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo Oficial Pullmanbus Cuponeras */}
          <div
            onClick={() => handleTabChange('catalogo')}
            className="flex items-center cursor-pointer group"
          >
            <img
              src="/logo-boletos.png"
              alt="boletos.la"
              width={180}
              height={60}
              className="object-contain hover:scale-105 transition-transform"
            />
          </div>

          {/* Contenedor Derecho (Nav Desktop + Auth Mobile/Desktop) */}
          <div className="flex items-center gap-2 lg:gap-4">
            
            {/* Enlaces de Navegación (Solo Desktop) */}
            <nav className="hidden lg:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`px-4 py-2 rounded-full text-base lg:text-lg font-bold transition-all duration-300 hover:bg-neutral-800/50 no-underline cursor-pointer ${
                      isActive
                        ? 'text-[#00c7cc]'
                        : 'text-neutral-300 hover:text-[#00c7cc]'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Autenticación (Mobile y Desktop) */}
            {user ? (
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-md p-1 lg:pl-3 shadow-sm">
                <button
                  onClick={() => handleTabChange('perfil')}
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  title="Ir a Mis Datos"
                >
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-xs font-bold text-neutral-200">{fixEncoding(user.nombre) || 'Usuario'}</span>
                    <span className="text-[10px] text-neutral-400 font-medium">{user.rut}</span>
                  </div>
                  <div className="w-8 h-8 rounded-md bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-4 h-4" />
                  </div>
                </button>
                <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-950/30 rounded-md transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 rounded-full text-base lg:text-lg font-bold transition-all duration-300 hover:bg-neutral-800/50 text-neutral-300 hover:text-[#00c7cc] inline-flex items-center gap-1.5"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden lg:inline">Iniciar Sesión</span>
                <span className="lg:hidden">Ingresar</span>
              </button>
            )}

            {/* Separador y Logo WIT (Solo Desktop) */}
            <div className="hidden lg:block border-l border-neutral-800 pl-6 ml-2">
              <img
                src="/logo-wit-dark.png"
                alt="WIT Logo"
                width={45}
                height={45}
                className="object-contain hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden flex overflow-x-auto border-t border-neutral-800 bg-[#1a1a1a] p-2 gap-2 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex-1 min-w-[100px] flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#00c7cc] bg-neutral-800/50' 
                  : 'text-neutral-400 hover:text-[#00c7cc] hover:bg-neutral-800/30'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
