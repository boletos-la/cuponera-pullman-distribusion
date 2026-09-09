'use client';

import React from 'react';
import { ShoppingCart, LayoutDashboard, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';

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
      {/* Top Bar Informativo */}
      <div className="bg-gradient-to-r from-[#D94B18] via-[#F05A24] to-[#FF7336] text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-white text-[#F05A24] px-2 py-0.5 rounded font-black uppercase text-[10px] tracking-wider shadow-xs">
              Pullmanbus
            </span>
            <span className="hidden sm:inline text-orange-100">
              Portal Oficial de Cuponeras Digitales • Venta y Autogestión con Tarifa Congelada
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="flex items-center gap-1 bg-slate-900/80 hover:bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-semibold transition-all text-[11px] cursor-pointer"
              title="Borrar compras y cupones creados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Datos</span>
            </button>

            <button
              onClick={onOpenExceptionModal}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full font-semibold transition-all text-[11px] cursor-pointer backdrop-blur-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulador de 7 Excepciones</span>
            </button>
          </div>
        </div>
      </div>

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
