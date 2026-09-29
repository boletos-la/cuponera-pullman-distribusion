import React, { useState } from 'react';
import { ShoppingCart, Ticket, Calendar, Clock, MapPin, Search } from 'lucide-react';

interface HistoryTabProps {
  compras: any[];
  canjes: any[];
}

export default function HistoryTab({ compras, canjes }: HistoryTabProps) {
  const [view, setView] = useState<'compras' | 'canjes'>('compras');
  const [searchCompras, setSearchCompras] = useState('');
  const [searchCanjes, setSearchCanjes] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 sticky top-[154px] z-30 bg-white/95 backdrop-blur-sm py-4 -mx-6 px-6 sm:-mx-8 sm:px-8 shadow-[0_4px_6px_-1px_rgba(255,255,255,0.9)] mt-[-24px]">
        <button
          onClick={() => setView('compras')}
          className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all ${view === 'compras' ? 'border-[#fa5e00] text-[#fa5e00]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Historial de Compras
        </button>
        <button
          onClick={() => setView('canjes')}
          className={`pb-2 px-2 text-sm font-bold border-b-2 transition-all ${view === 'canjes' ? 'border-[#fa5e00] text-[#fa5e00]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Historial de Canjes
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        {view === 'compras' && (
          <>
            <div className="mb-4 sticky top-[220px] z-20 bg-white/95 backdrop-blur-md py-3 -mx-6 px-6 shadow-sm rounded-xl">
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Buscar en compras (ej. orden, cuponera, nombre)..."
                  value={searchCompras}
                  onChange={(e) => setSearchCompras(e.target.value)}
                  className="w-full text-sm font-medium bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#fa5e00] text-[#0F172A]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-2.5" />
              </div>
            </div>
            {compras && compras.filter(c => 
              c.orden_compra?.toLowerCase().includes(searchCompras.toLowerCase()) || 
              c.UsuarioCuponera?.Cuponera?.nombre?.toLowerCase().includes(searchCompras.toLowerCase()) ||
              (c.id_usuario_cuponera && `CUP-WP${c.id_usuario_cuponera}`.toLowerCase().includes(searchCompras.toLowerCase())) ||
              (c.UsuarioCuponera?.id && `CUP-WP${c.UsuarioCuponera.id}`.toLowerCase().includes(searchCompras.toLowerCase()))
            ).length > 0 ? (
              <div className="space-y-4">
                {compras.filter(c => 
                  c.orden_compra?.toLowerCase().includes(searchCompras.toLowerCase()) || 
                  c.UsuarioCuponera?.Cuponera?.nombre?.toLowerCase().includes(searchCompras.toLowerCase()) ||
                  (c.id_usuario_cuponera && `CUP-WP${c.id_usuario_cuponera}`.toLowerCase().includes(searchCompras.toLowerCase())) ||
                  (c.UsuarioCuponera?.id && `CUP-WP${c.UsuarioCuponera.id}`.toLowerCase().includes(searchCompras.toLowerCase()))
                ).map((compra: any) => (
                  <div key={compra.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-[#023caf] flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900">
                          {compra.UsuarioCuponera?.Cuponera?.nombre || 'Cuponera'}
                        </h4>
                        <div className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Compra: {new Date(compra.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
                          {compra.UsuarioCuponera?.Cuponera?.maximo_usos && (
                            <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> {compra.UsuarioCuponera.Cuponera.maximo_usos} pasajes</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right flex flex-col items-start md:items-end gap-1 shrink-0">
                      <div className="flex items-baseline md:justify-end gap-2 mb-0.5">
                        <span className="text-sm font-black text-emerald-600">${compra.monto.toLocaleString('es-CL')}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">{compra.pasarela}</span>
                      </div>
                      {(compra.id_usuario_cuponera || compra.UsuarioCuponera?.id) && (
                        <span className="text-[10px] font-mono font-extrabold text-[#023caf] bg-blue-50 px-2 py-1 rounded border border-blue-200" title="Código de Cuponera Asociada">
                          Cuponera: CUP-WP{compra.id_usuario_cuponera || compra.UsuarioCuponera?.id}
                        </span>
                      )}
                      {compra.orden_compra && (
                        <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600 font-medium" title="Orden de Compra">
                          Orden de compra: {compra.orden_compra}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No se encontraron compras que coincidan con la búsqueda.</p>
            )}
          </>
        )}

        {view === 'canjes' && (
          <>
            <div className="mb-4 sticky top-[220px] z-20 bg-white/95 backdrop-blur-md py-3 -mx-6 px-6 shadow-sm rounded-xl">
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Buscar en canjes (ej. origen, destino, cupón, PNR)..."
                  value={searchCanjes}
                  onChange={(e) => setSearchCanjes(e.target.value)}
                  className="w-full text-sm font-medium bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#fa5e00] text-[#0F172A]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-2.5" />
              </div>
            </div>
            {canjes && canjes.filter(c => 
              c.origen?.toLowerCase().includes(searchCanjes.toLowerCase()) || 
              c.destino?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
              c.Cupon?.codigo?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
              c.pnr_operador?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
              c.pnr_kupos?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
              (c.Cupon?.id_usuario_cuponera && `CUP-WP${c.Cupon.id_usuario_cuponera}`.toLowerCase().includes(searchCanjes.toLowerCase()))
            ).length > 0 ? (
              <div className="space-y-4">
                {canjes.filter(c => 
                  c.origen?.toLowerCase().includes(searchCanjes.toLowerCase()) || 
                  c.destino?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
                  c.Cupon?.codigo?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
                  c.pnr_operador?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
                  c.pnr_kupos?.toLowerCase().includes(searchCanjes.toLowerCase()) ||
                  (c.Cupon?.id_usuario_cuponera && `CUP-WP${c.Cupon.id_usuario_cuponera}`.toLowerCase().includes(searchCanjes.toLowerCase()))
                ).map((canje: any) => (
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
                      <span className="text-[10px] font-mono font-extrabold text-[#fa5e00] bg-[#FFEDD5] px-2 py-1 rounded border border-[#FED7AA]" title="Código de Cupón">
                        Cupón: {canje.Cupon.codigo}
                      </span>
                    )}
                    {canje.Cupon?.id_usuario_cuponera && (
                      <span className="text-[10px] font-mono font-extrabold text-[#023caf] bg-blue-50 px-2 py-1 rounded border border-blue-200" title="Código de Cuponera Asociada">
                        Cuponera: CUP-WP{canje.Cupon.id_usuario_cuponera}
                      </span>
                    )}
                    {canje.pnr_operador && (
                      <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600" title="PNR Operador">
                        PNR Operador: {canje.pnr_operador}
                      </span>
                    )}
                    {canje.pnr_kupos && (
                      <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600" title="PNR Kupos">
                        PNR Kupos: {canje.pnr_kupos}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No se encontraron canjes que coincidan con la búsqueda.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
