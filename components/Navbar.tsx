'use client';

import React from 'react';
import { ShoppingCart, LayoutDashboard, RotateCcw, ShieldAlert, Trash2, User, LogOut, LogIn } from 'lucide-react';
import { getAuthToken, removeAuthToken } from '@/lib/apiClient';

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

  const [userProfile, setUserProfile] = React.useState<{ nombre: string; rut: string } | null>(null);

  React.useEffect(() => {
    const updateProfile = () => {
      const token = getAuthToken();
      if (token) {
        try {
          const payloadStr = atob(token.split('.')[1]);
          const payload = JSON.parse(payloadStr);
          setUserProfile({
            nombre: payload.nombre || 'Usuario',
            rut: payload.rut
          });
        } catch (e) {
          console.error('Invalid token format');
        }
      } else {
        setUserProfile(null);
      }
    };

    updateProfile();
    window.addEventListener('auth-change', updateProfile);
    return () => window.removeEventListener('auth-change', updateProfile);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    window.location.reload();
  };

  const handleLoginClick = () => {
    setActiveTab('dashboard');
  };

  const handleResetData = async () => {
    if (confirm('¿Estás seguro de que deseas borrar todos los datos de compras, cupones y pasajes registrados?')) {
      try {
        const res = await fetch('/api/admin/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert('¡Los datos han sido limpiados exitosamente! La página se recargará.');
          window.location.reload();
        }
      } catch (e) {
        alert('Error al limpiar datos.');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">


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
          </nav>
          
          {/* User Profile & Auth */}
          <div className="hidden lg:flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
            {userProfile ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800">{userProfile.nombre}</span>
                  <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{userProfile.rut}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F05A24] flex items-center justify-center border border-orange-200">
                  <User className="w-4 h-4" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
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
