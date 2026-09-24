'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Cuponera, AuditoriaLog } from '@/lib/dataStore';
import { getApiUrl } from '@/lib/apiClient';
import { Settings, Plus, Edit2, History, Check, X, ShieldAlert, Trash2, ArrowLeftRight } from 'lucide-react';
import { ComboBox } from '@/components/ui/combobox';

interface TramoItem {
  origen: string;
  destino: string;
}

const FREQUENT_CITIES = [
  'Santiago',
  'Viña Del Mar',
  'Valparaiso',
  'Concón',
  'Quilpué',
  'Villa Alemana',
  'Quillota',
  'Limache',
  'Olmue',
  'Algarrobo',
  'El Quisco',
  'El Tabo',
  'Cartagena',
  'San Antonio',
  'Santo Domingo',
  'Los Andes',
  'San Felipe',
  'Rancagua',
  'La Serena',
  'Coquimbo',
  'Curicó',
  'Talca',
  'Chillán',
  'Concepción',
  'Los Ángeles',
  'Temuco',
  'Valdivia',
  'Osorno',
  'Puerto Montt'
];

export default function AdminMaintainer() {
  const [cuponeras, setCuponeras] = useState<Cuponera[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Ciudades desde GDS
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Formulario de Edición/Creación
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tramosItems, setTramosItems] = useState<TramoItem[]>([
    { origen: 'Santiago', destino: 'Viña Del Mar' }
  ]);
  const [valorUnitario, setValorUnitario] = useState<number | ''>(4900);
  const [cantidadCupones, setCantidadCupones] = useState<number | ''>(20);
  const [categoria, setCategoria] = useState('');
  const [badge, setBadge] = useState('');
  const [activa, setActiva] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoadingCities(true);
    try {
      const res = await fetch(`${getApiUrl()}/gds/cities`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.cities)) {
          const map = new Map<string, string>();
          data.cities.forEach((c: { name: string }) => {
            const clean = (c.name || '').replace(/[\t\r\n]+/g, ' ').trim();
            if (clean && !map.has(clean.toLowerCase())) {
              map.set(clean.toLowerCase(), clean);
            }
          });
          const sorted = Array.from(map.values()).sort((a, b) => a.localeCompare('es'));
          setCities(sorted);
        }
      }
    } catch (err) {
      console.error('Error al cargar ciudades GDS:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const cityItems = useMemo(() => {
    const map = new Map<string, string>();
    FREQUENT_CITIES.forEach(c => map.set(c.toLowerCase(), c));
    cities.forEach(c => {
      if (!map.has(c.toLowerCase())) map.set(c.toLowerCase(), c);
    });
    return Array.from(map.values()).map(c => ({ label: c, value: c }));
  }, [cities]);

  const handleAddTramo = () => {
    setTramosItems(prev => [...prev, { origen: '', destino: '' }]);
  };

  const handleTramoChange = (index: number, field: 'origen' | 'destino', value: string) => {
    setTramosItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveTramo = (index: number) => {
    setTramosItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cuponeras');
      const data = await res.json();
      if (data.success) {
        setCuponeras(data.cuponeras);
        setAuditoria(data.auditoria);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setTramosItems([
      { origen: 'Santiago', destino: 'Viña Del Mar' }
    ]);
    setValorUnitario(4900);
    setCantidadCupones(20);
    setCategoria('');
    setBadge('');
    setActiva(true);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Cuponera) => {
    setEditingId(c.id);
    setNombre(c.nombre);
    setDescripcion(c.descripcion);
    const parsedTramosMap = new Map<string, TramoItem>();
    (c.tramos || []).forEach(t => {
      const parts = t.split('-');
      if (parts.length >= 2) {
        const origen = parts[0]?.trim() || '';
        const destino = parts[1]?.trim() || '';
        const key1 = `${origen}-${destino}`;
        const key2 = `${destino}-${origen}`;
        if (!parsedTramosMap.has(key1) && !parsedTramosMap.has(key2)) {
          parsedTramosMap.set(key1, { origen, destino });
        }
      }
    });
    const parsed = Array.from(parsedTramosMap.values());
    setTramosItems(parsed.length > 0 ? parsed : [{ origen: '', destino: '' }]);
    setValorUnitario(c.valorUnitario);
    setCantidadCupones(c.cantidadCupones);
    setCategoria(c.categoria || '');
    setBadge(c.badge || '');
    setActiva(c.activa);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const formattedTramos = Array.from(new Set(
      tramosItems
        .filter(t => t.origen.trim() && t.destino.trim())
        .flatMap(t => [
          `${t.origen.trim()}-${t.destino.trim()}`,
          `${t.destino.trim()}-${t.origen.trim()}`
        ])
    ));

    if (formattedTramos.length === 0) {
      setMsg('Debes configurar al menos un tramo con origen y destino válidos.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/cuponeras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          nombre,
          descripcion,
          tramos: formattedTramos,
          valorUnitario: Number(valorUnitario) || 0,
          cantidadCupones: Number(cantidadCupones) || 1,
          categoria,
          badge,
          activa
        })
      });

      const data = await res.json();

      if (data.success) {
        setMsg(data.mensaje);
        setShowModal(false);
        fetchAdminData();
      } else {
        setMsg(data.error || 'Error al guardar.');
      }
    } catch (err) {
      setMsg('Error de servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Seccion Mantenedor (Sección 15) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="bg-[#FFF7ED] text-[#F05A24] border border-[#FFEDD5] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Requerimiento Sección 15
            </span>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
              <Settings className="w-6 h-6 text-[#F05A24]" />
              Mantenedor Administrativo de Cuponeras
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Crea y edita paquetes de cuponeras, tramos autorizados, precios unitarios y conmuta la publicación en el catálogo.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="bg-[#F05A24] hover:bg-[#D94B18] text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Crear Nueva Cuponera</span>
          </button>
        </div>

        {msg && <p className="text-xs text-emerald-600 font-bold">{msg}</p>}

        {/* Tabla Mantenedor */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Tramos Habilitados</th>
                <th className="p-3">Valor Uni.</th>
                <th className="p-3">N° Cupones</th>
                <th className="p-3">Precio Total</th>
                <th className="p-3">Publicada</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuponeras.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-400">#{c.id}</td>
                  <td className="p-3 font-bold text-slate-900">{c.nombre}</td>
                  <td className="p-3 max-w-xs truncate text-slate-600">{c.tramos.join(', ')}</td>
                  <td className="p-3 font-semibold text-slate-700">${c.valorUnitario.toLocaleString('es-CL')}</td>
                  <td className="p-3 font-[#F05A24] font-bold text-[#F05A24]">{c.cantidadCupones}</td>
                  <td className="p-3 font-black text-[#F05A24]">${c.precioTotal.toLocaleString('es-CL')}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.activa ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {c.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 bg-blue-50 text-[#0A4DA6] hover:bg-blue-100 rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visor de Auditoría y Trazabilidad */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#0A4DA6]" />
            <h3 className="text-lg font-black text-slate-900">Logs de Trazabilidad y Auditoría (auditoria.json)</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{auditoria.length} registros cargados</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {auditoria.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay registros de trazabilidad y auditoría disponibles.
            </div>
          ) : (
            auditoria.map((log) => {
              let badgeColor = 'bg-blue-600 text-white';
              if (log.accion === 'CANJE_CUPON') badgeColor = 'bg-emerald-600 text-white';
              else if (log.accion === 'ANULACION_PASAJE') badgeColor = 'bg-rose-600 text-white';
              else if (log.accion === 'COMPRA_CUPONERA') badgeColor = 'bg-[#0A4DA6] text-white';
              else if (log.accion === 'OTP_VALIDADO') badgeColor = 'bg-teal-600 text-white';
              else if (log.accion === 'OTP_GENERADO') badgeColor = 'bg-amber-600 text-white';
              else if (log.accion === 'CREACION_CUPONERA' || log.accion === 'EDICION_CUPONERA') badgeColor = 'bg-orange-600 text-white';

              return (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                      {log.accion}
                    </span>
                    <span className="text-slate-400 text-[11px]">{new Date(log.fechaHora).toLocaleString('es-CL')}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{log.detalles}</p>
                  {(log.rutUsuario || log.nombreUsuario) && (
                    <p className="text-[10px] text-slate-500">
                      Usuario: <span className="font-semibold text-slate-700">{log.nombreUsuario || ''}</span>
                      {log.rutUsuario ? ` (${log.rutUsuario})` : ''}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Formulario Edición/Creación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">
                {editingId ? `Editar Cuponera #${editingId}` : 'Crear Nueva Cuponera'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Cuponera *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. CUPONERA VIÑA DEL MAR (20 CUPONES)"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Descripción de la cuponera"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Viña del Mar, Litoral Central"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Popular, Más Vendida"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">Tramos Autorizados (GDS) *</label>
                  {loadingCities && (
                    <span className="text-[10px] text-blue-600 animate-pulse font-medium">
                      Sincronizando ciudades GDS...
                    </span>
                  )}
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {tramosItems.map((tramo, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          Tramo
                        </span>
                        {tramosItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTramo(index)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 font-normal cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Origen
                          </label>
                          <ComboBox
                            items={cityItems}
                            value={tramo.origen}
                            onChange={(val) => handleTramoChange(index, 'origen', val)}
                            placeholder="Selecciona origen..."
                          />
                        </div>

                        <div className="flex flex-col items-center justify-center pt-4">
                          <ArrowLeftRight className="w-4 h-4 text-slate-300" />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Destino
                          </label>
                          <ComboBox
                            items={cityItems}
                            value={tramo.destino}
                            onChange={(val) => handleTramoChange(index, 'destino', val)}
                            placeholder="Selecciona destino..."
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddTramo}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mt-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agregar otro tramo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Unitario (CLP) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={valorUnitario}
                    onChange={(e) => setValorUnitario(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° de Cupones *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={cantidadCupones}
                    onChange={(e) => setCantidadCupones(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activaToggle"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  className="rounded text-[#0A4DA6]"
                />
                <label htmlFor="activaToggle" className="font-bold text-slate-700 cursor-pointer">
                  Publicar y Activar Cuponera en el Catálogo Público
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm cursor-pointer"
              >
                {saving ? 'Guardando...' : 'Guardar Cuponera'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
