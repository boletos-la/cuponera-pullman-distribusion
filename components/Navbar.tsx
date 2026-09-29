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
    { id: 'dashboard', label: 'Mi Dashboard', icon: LayoutDashboard },
    { id: 'anulacion', label: 'Anular Pasaje', icon: RotateCcw },
  ];

  const [showLoginModal, setShowLoginModal] = React.useState(false);
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
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={() => {
            setActiveTab('dashboard');
          }}
        />
      )}


      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo Oficial Pullmanbus Cuponeras */}
          <div
            onClick={() => setActiveTab('catalogo')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="font-black text-2xl tracking-tighter text-[#fa5e00]">pullman</span>
                <span className="font-black text-2xl tracking-tighter text-[#fa5e00]">bus</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none -mt-1">
                Cuponeras Digitales
              </span>
            </div>
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
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-105 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <div className="w-px h-6 bg-border mx-2"></div>
            
            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-foreground">{user.nombre || 'Usuario'}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{user.rut}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-105 cursor-pointer bg-[#fa5e00] text-white hover:bg-[#fa5e00]/90 shadow-sm ml-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}

            {/* Separador y Logo WIT SPA */}
            <div className="w-px h-6 bg-border mx-2"></div>
            <div className="flex items-center">
              <span className="text-[11px] font-black tracking-widest text-[#023caf] bg-blue-50/50 px-3 py-1.5 rounded-md border border-blue-100">
                WIT
              </span>
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
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground/80 bg-background border border-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
