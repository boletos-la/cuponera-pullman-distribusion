'use client';

import React from 'react';
import { ShoppingCart, LayoutDashboard, RotateCcw, ShieldAlert, Trash2, User, LogOut, LogIn } from 'lucide-react';
import { getAuthToken, removeAuthToken, getAuthUser } from '@/lib/apiClient';
import LoginModal from './LoginModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenExceptionModal: () => void;
}

export default function Navbar({ activeTab, setActiveTab, onOpenExceptionModal }: NavbarProps) {
  const navItems = [
    { id: 'catalogo', label: 'Catálogo Cuponeras', icon: ShoppingCart },
    { id: 'dashboard', label: 'Mis cuponeras', icon: LayoutDashboard },
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

  const handleLogout = () => {
    removeAuthToken();
    setActiveTab('catalogo');
    setShowLogoutConfirm(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => {
            setActiveTab('catalogo');
          }}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner border border-red-100 mb-6">
              <LogOut className="w-8 h-8 ml-1" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">¿Cerrar Sesión?</h3>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Tu sesión actual será finalizada. Tendrás que ingresar nuevamente para acceder a tus cuponeras.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] active:scale-[0.98]"
              >
                Sí, cerrar sesión
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98]"
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
            onClick={() => setActiveTab('catalogo')}
            className="flex items-center cursor-pointer group"
          >
            <img
              src="/logo-pullman.png"
              alt="Pullman Cuponeras"
              width={180}
              height={60}
              className="object-contain hover:scale-105 transition-transform"
            />
          </div>

          {/* Enlaces de Navegación */}
          <nav className="hidden lg:flex items-center space-x-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 h-10 px-6 py-2 rounded-full text-sm transition-all hover:scale-105 cursor-pointer ${
                    isActive
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm'
                      : 'border border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-secondary-foreground' : 'text-secondary'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            {user ? (
              <div className="flex items-center gap-1 ml-2 bg-slate-50 border border-slate-200 rounded-full p-1 pl-3 shadow-sm">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  title="Ir a Mis Datos"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-800">{user.nombre || 'Usuario'}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{user.rut}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#023caf] text-white flex items-center justify-center shrink-0 shadow-inner">
                    <User className="w-4 h-4" />
                  </div>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 h-10 px-6 py-2 rounded-full text-sm transition-all hover:scale-105 cursor-pointer bg-[#fa5e00] text-white hover:bg-[#fa5e00]/90 shadow-sm ml-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}

            {/* Separador y Logo WIT */}
            <div className="w-px h-7 bg-border mx-2"></div>
            <div className="flex items-center">
              <img
                src="/logo-wit-dark.png"
                alt="WIT Logo"
                className="h-8 md:h-9 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity duration-300 ml-1"
              />
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden flex overflow-x-auto border-t border-border bg-muted/30 p-2 gap-2 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-sm transition-all hover:scale-105 cursor-pointer ${
                isActive 
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm' 
                  : 'border border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-secondary-foreground' : 'text-secondary'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
