'use client';

import React from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface ExceptionSimulatorProps {
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export default function ExceptionSimulator({ onClose, onNavigateTab }: ExceptionSimulatorProps) {
  const exceptions = [
    {
      id: 1,
      titulo: 'Excepción #1: Pago Rechazado o No Confirmado',
      descripcion: 'En el modal de compra del Catálogo, activa el switch "Simular rechazo en pasarela Webpay".',
      accion: () => onNavigateTab('catalogo')
    },
    {
      id: 2,
      titulo: 'Excepción #2: Pago Aprobado sin Generación de Cupones',
      descripcion: 'El sistema valida la atomicidad y notifica de inconsistencias con reintento automático.',
      accion: () => onNavigateTab('catalogo')
    },
    {
      id: 3,
      titulo: 'Excepción #3: Cupón Vencido (>90 días) o Ya Utilizado',
      descripcion: 'Ingresa un cupón utilizado o vencido en la pantalla de Canje para probar el rechazo inmediato.',
      accion: () => onNavigateTab('canje')
    },
    {
      id: 4,
      titulo: 'Excepción #4: Token 2FA Incorrecto o Expirado (300s)',
      descripcion: 'En el modal de 2FA, ingresa un código erróneo (ej: 000000) o espera que el contador de 5 minutos llegue a 00:00.',
      accion: () => onNavigateTab('canje')
    },
    {
      id: 5,
      titulo: 'Excepción #5: Reserva Iniciada Sin Emisión de Pasaje',
      descripcion: 'Selecciona un asiento en el bus y cierra el modal 2FA antes de confirmar. El asiento se libera automáticamente.',
      accion: () => onNavigateTab('canje')
    },
    {
      id: 6,
      titulo: 'Excepción #6: Fallo Durante el Canje o Descuento de Cupón',
      descripcion: 'El sistema aplica rollback de la transacción manteniendo el cupón en estado Activo si la emisión falla.',
      accion: () => onNavigateTab('canje')
    },
    {
      id: 7,
      titulo: 'Excepción #7: Indisponibilidad de Integraciones Externas',
      descripcion: 'Prueba la resiliencia del portal con datos en fallback local JSON.',
      accion: () => onNavigateTab('dashboard')
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-cyan-100 text-[#FF6B00] flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-wider block">
                Herramienta de Control de Calidad
              </span>
              <h3 className="text-xl font-black text-slate-900">Simulador de las 7 Excepciones de Negocio</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Haz clic en cualquiera de las 7 excepciones para ser redirigido a la sección correspondiente del portal con las instrucciones de prueba:
        </p>

        <div className="space-y-3">
          {exceptions.map((ex) => (
            <div key={ex.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-4 hover:border-cyan-300 transition-all">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-[#023caf] block">{ex.titulo}</span>
                <p className="text-xs text-slate-600">{ex.descripcion}</p>
              </div>

              <button
                onClick={() => {
                  ex.accion();
                  onClose();
                }}
                className="bg-[#023caf] hover:bg-blue-900 text-white text-xs font-bold px-3 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer shrink-0"
              >
                Probar Ahora
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-md cursor-pointer"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
}
