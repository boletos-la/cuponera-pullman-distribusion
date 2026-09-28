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
                <span className="font-black text-2xl tracking-tighter text-[#E85D04]">pullman</span>
                <span className="font-black text-2xl tracking-tighter text-[#F05A24]">bus</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none -mt-1">
                Cuponeras Digitales
              </span>
            </div>
          </div>

          {/* Enlaces de Navegación */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F05A24] text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                      : 'text-slate-600 hover:text-[#F05A24] hover:bg-orange-50/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            
            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-800">{user.nombre || 'Usuario'}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{user.rut}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer bg-[#0A4DA6] text-white hover:bg-blue-700 shadow-sm ml-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden flex overflow-x-auto border-t border-slate-200 bg-slate-50 p-1.5 gap-1 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-medium whitespace-nowrap ${
                isActive ? 'bg-[#F05A24] text-white font-extrabold' : 'text-slate-600 bg-white border border-slate-200'
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
