import React, { useState } from 'react';
import { ShoppingCart, Ticket, Calendar, Clock, MapPin } from 'lucide-react';

interface HistoryTabProps {
  compras: any[];
  canjes: any[];
}

export default function HistoryTab({ compras, canjes }: HistoryTabProps) {
  const [view, setView] = useState<'compras' | 'canjes'>('compras');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setView('compras')}
          className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all ${view === 'compras' ? 'border-[#F05A24] text-[#F05A24]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Historial de Compras
        </button>
        <button
          onClick={() => setView('canjes')}
          className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all ${view === 'canjes' ? 'border-[#F05A24] text-[#F05A24]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Historial de Canjes
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        {view === 'compras' && (
          compras && compras.length > 0 ? (
            <div className="space-y-4">
              {compras.map((compra: any) => (
                <div key={compra.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0A4DA6] flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                        {compra.UsuarioCuponera?.Cuponera?.nombre || 'Cuponera'}
                        <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-bold">
                          {compra.orden_compra}
                        </span>
                      </h4>
                      <div className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Compra: {new Date(compra.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                        {compra.UsuarioCuponera?.Cuponera?.maximo_usos && (
                          <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> {compra.UsuarioCuponera.Cuponera.maximo_usos} pasajes</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-black text-emerald-600">${compra.monto.toLocaleString('es-CL')}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{compra.pasarela}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No se encontraron compras en el historial.</p>
          )
        )}

        {view === 'canjes' && (
          canjes && canjes.length > 0 ? (
            <div className="space-y-4">
              {canjes.map((canje: any) => (
                <div key={canje.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900">{canje.origen} - {canje.destino}</h4>
                      <div className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Viaje: {new Date(canje.fecha_viaje).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Asiento: {canje.asiento}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Canje: {new Date(canje.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-col items-start md:items-end gap-1">
                    {canje.Cupon?.codigo && (
                      <span className="text-[10px] font-mono font-extrabold text-[#F05A24] bg-[#FFEDD5] px-2 py-1 rounded border border-[#FED7AA]">
                        Cupón: {canje.Cupon.codigo}
                      </span>
                    )}
                    <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                      PNR: {canje.pnr_operador || canje.pnr_kupos}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No se encontraron canjes en el historial.</p>
          )
        )}
      </div>
    </div>
  );
}
