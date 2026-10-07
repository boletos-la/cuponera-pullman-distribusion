'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Cuponera, AuditoriaLog } from '@/lib/dataStore';
import { getApiUrl, apiClient } from '@/lib/apiClient';
import { Settings, Plus, Minus, Edit2, History, Check, X, ShieldAlert, Trash2, ArrowLeftRight, Users, CreditCard, Ticket, ShoppingBag, Search, ChevronUp, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { ComboBox } from '@/components/ui/combobox';
import { fixEncoding } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';
interface TramoItem {
  origen: string;
  destino: string;
}

const FREQUENT_CITIES = [
  'Santiago', 'Viña Del Mar', 'Valparaiso', 'Concón', 'Quilpué', 'Villa Alemana',
  'Quillota', 'Limache', 'Olmue', 'Algarrobo', 'El Quisco', 'El Tabo', 'Cartagena',
  'San Antonio', 'Santo Domingo', 'Los Andes', 'San Felipe', 'Rancagua', 'La Serena',
  'Coquimbo', 'Curicó', 'Talca', 'Chillán', 'Concepción', 'Los Ángeles', 'Temuco',
  'Valdivia', 'Osorno', 'Puerto Montt'
];

export default function AdminMaintainer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'catalogo' | 'usuarios' | 'transacciones' | 'canjes' | 'compras' | 'auditoria' | 'configuracion'>('catalogo');
  const [cuponeras, setCuponeras] = useState<Cuponera[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaLog[]>([]);

  // Nuevos estados para las otras tablas
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [canjes, setCanjes] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);

  // Estados de busqueda
  const [searchUsuario, setSearchUsuario] = useState('');
  const [searchTx, setSearchTx] = useState('');
  const [searchCanjes, setSearchCanjes] = useState('');
  const [searchCompras, setSearchCompras] = useState('');
  const [searchAuditoria, setSearchAuditoria] = useState('');
  const [searchCuponera, setSearchCuponera] = useState('');
  const [filterAccionAuditoria, setFilterAccionAuditoria] = useState('');
  const [expandedUserCompras, setExpandedUserCompras] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [auditDrawer, setAuditDrawer] = useState<{
    isOpen: boolean;
    title: string;
    type: 'payload' | 'response';
    log: AuditoriaLog | null;
    data: any;
  }>({
    isOpen: false,
    title: '',
    type: 'payload',
    log: null,
    data: null
  });
  const [copiedJson, setCopiedJson] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tramosItems, setTramosItems] = useState<TramoItem[]>([{ origen: 'Santiago', destino: 'Viña Del Mar' }]);
  const [valorUnitario, setValorUnitario] = useState<number | ''>(4900);
  const [cantidadCupones, setCantidadCupones] = useState<number | ''>(20);
  const [categoria, setCategoria] = useState('');
  const [badge, setBadge] = useState('');
  const [activa, setActiva] = useState(true);

  // Nuevos estados para el diseño
  const [descuento, setDescuento] = useState('');
  const [enviarOta, setEnviarOta] = useState('Si');
  const [estadoActivo, setEstadoActivo] = useState('Activo');
  const [nominativo, setNominativo] = useState('Si');
  const [tipoAsiento, setTipoAsiento] = useState('Todos');
  const [boletoAdicional, setBoletoAdicional] = useState(0);
  const [enableBranch, setEnableBranch] = useState(false);
  const [enableWebsite, setEnableWebsite] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchUsuario, searchTx, searchCanjes, searchCompras, searchAuditoria, searchCuponera, sortConfig]);

  const paginate = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    let pagesToShow = [];
    if (totalPages <= 5) {
      pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 3) {
        pagesToShow = [1, 2, 3, 4, 5];
      } else if (currentPage >= totalPages - 2) {
        pagesToShow = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pagesToShow = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
      }
    }

    return (
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-md mb-4 shadow-sm animate-fade-in">
        <span className="text-xs font-bold text-slate-500 ml-2">
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
        </span>
        <div className="flex items-center gap-1.5 mr-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
          >
            Ant
          </button>
          
          <div className="flex gap-1">
            {pagesToShow.map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs ${
                  currentPage === p 
                    ? 'bg-[#ff6700] text-white border-transparent' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100 disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
          >
            Sig
          </button>
        </div>
      </div>
    );
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    const isSorted = sortConfig && sortConfig.key === key;
    if (isSorted) {
      return sortConfig.direction === 'asc' ? (
        <span className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded bg-blue-100 text-[#023caf] shadow-xs" title="Orden ascendente (clic para alternar)">
          <ArrowUp className="w-3 h-3 stroke-[2.5]" />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded bg-blue-100 text-[#023caf] shadow-xs" title="Orden descendente (clic para alternar)">
          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-slate-300 group-hover:text-slate-600 transition-colors" title="Ordenar por esta columna">
        <ArrowUpDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
      </span>
    );
  };

  const sortData = (data: any[]) => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nested values
      if (sortConfig.key === 'cuponera.nombre') {
        aVal = a.CuponeraCatalogo?.nombre || a.UsuarioCuponera?.Cuponera?.nombre || a.Cuponera?.nombre || '';
        bVal = b.CuponeraCatalogo?.nombre || b.UsuarioCuponera?.Cuponera?.nombre || b.Cuponera?.nombre || '';
      } else if (sortConfig.key === 'cupon.codigo') {
        aVal = a.Cupon?.codigo || '';
        bVal = b.Cupon?.codigo || '';
      } else if (sortConfig.key === 'cupon.UsuarioCuponera.Cuponera.nombre') {
        aVal = a.Cupon?.UsuarioCuponera?.Cuponera?.nombre || '';
        bVal = b.Cupon?.UsuarioCuponera?.Cuponera?.nombre || '';
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, 'es', { numeric: true, sensitivity: 'base' });
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api').replace('/api', '');
    return `${baseUrl}${url}`;
  };

  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize si es muy grande (max 1920 de ancho)
          const MAX_WIDTH = 1920;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            }, 'image/jpeg', 0.8); // 80% calidad jpeg reduce masivamente el peso
          } else {
            reject(new Error('Canvas context failed'));
          }
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (data.success && data.data.bannerUrl) {
        setBannerUrl(data.data.bannerUrl);
      }
    } catch (e) {}
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const formData = new FormData();
      if (bannerFile) {
        // Comprimir la imagen antes de subir para evitar 413 Content Too Large (Nginx o Vercel limit)
        const compressedBlob = await compressImage(bannerFile);
        formData.append('bannerFile', compressedBlob, bannerFile.name.replace(/\.[^/.]+$/, "") + ".jpg");
      } else {
        formData.append('bannerUrl', bannerUrl);
      }
      
      const tokenRes = await fetch('/api/admin/token');
      const tokenData = await tokenRes.json();
      
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api');
      const res = await fetch(`${backendUrl}/admin/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.token}`
        },
        body: formData
      });
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        const text = await res.text();
        throw new Error(`El servidor devolvió un error inesperado (no es JSON): ${text}`);
      }
      
      if (data.success) {
        toast.success('Configuración guardada exitosamente');
        if (data.data.bannerUrl) setBannerUrl(data.data.bannerUrl);
        setBannerFile(null); // Clear file input
      } else {
        toast.error('Error al guardar configuración: ' + (data.error || ''));
      }
    } catch (e: any) {
      toast.error('Error al guardar configuración: ' + e.message);
    }
    setSavingConfig(false);
  };

  const removeBanner = async () => {
    setSavingConfig(true);
    try {
      const formData = new FormData();
      formData.append('bannerUrl', '');
      
      const tokenRes = await fetch('/api/admin/token');
      const tokenData = await tokenRes.json();
      
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api');
      const res = await fetch(`${backendUrl}/admin/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.token}`
        },
        body: formData
      });
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        const text = await res.text();
        throw new Error(`El servidor devolvió un error inesperado (no es JSON): ${text}`);
      }
      
      if (data.success) {
        toast.success('Banner eliminado exitosamente');
        setBannerUrl('');
        setBannerFile(null);
      } else {
        toast.error('Error al eliminar banner: ' + (data.error || ''));
      }
    } catch (e: any) {
      toast.error('Error al eliminar banner: ' + e.message);
    }
    setSavingConfig(false);
  };

  useEffect(() => {
    fetchAdminData();
    fetchExtraData();
    loadCities();
    fetchConfig();
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
            if (clean && !map.has(clean.toLowerCase())) map.set(clean.toLowerCase(), clean);
          });
          setCities(Array.from(map.values()).sort((a, b) => a.localeCompare('es')));
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

  const fetchExtraData = async () => {
    try {
      const [resUsers, resTx, resCanjes, resCompras] = await Promise.all([
        apiClient('/admin/usuarios'),
        apiClient('/admin/transacciones'),
        apiClient('/admin/canjes'),
        apiClient('/admin/compras')
      ]);
      if (resUsers.success) setUsuarios(resUsers.data);
      if (resTx.success) setTransacciones(resTx.data);
      if (resCanjes.success) setCanjes(resCanjes.data);
      if (resCompras.success) setCompras(resCompras.data);
    } catch (err) {
      console.error("Error fetching extra admin data:", err);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null); setNombre(''); setDescripcion('');
    setTramosItems([{ origen: 'Santiago', destino: 'Viña Del Mar' }]);
    setValorUnitario(4900); setCantidadCupones(20); setCategoria(''); setBadge(''); setActiva(true); setEstadoActivo('Activo');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Cuponera) => {
    setEditingId(c.id); setNombre(c.nombre); setDescripcion(c.descripcion);
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
    setValorUnitario(c.valorUnitario); setCantidadCupones(c.cantidadCupones); setBoletoAdicional(c.boletosAdicionales || 0); setCategoria(c.categoria || ''); setBadge(c.badge || ''); setActiva(c.activa); setEstadoActivo(c.activa ? 'Activo' : 'Inactivo');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const formattedTramos = Array.from(new Set(
      tramosItems.filter(t => t.origen.trim() && t.destino.trim()).flatMap(t => [`${t.origen.trim()}-${t.destino.trim()}`, `${t.destino.trim()}-${t.origen.trim()}`])
    ));
    if (formattedTramos.length === 0) {
      toast.error('Debes configurar al menos un tramo con origen y destino válidos.');
      setSaving(false); return;
    }
    try {
      const res = await fetch('/api/admin/cuponeras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, nombre, descripcion, tramos: formattedTramos, valorUnitario: Number(valorUnitario) || 0, cantidadCupones: Number(cantidadCupones) || 1, boletosAdicionales: Number(boletoAdicional) || 0, categoria, badge, activa })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.mensaje || 'Guardado exitosamente'); 
        setShowModal(false); 
        fetchAdminData();
      } else {
        toast.error(data.error || 'Error al guardar.');
      }
    } catch (err) {
      toast.error('Error de servidor al guardar la cuponera.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCuponera = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/cuponeras?id=${deleteConfirmId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.mensaje || 'Cuponera eliminada con éxito');
        fetchAdminData();
      } else {
        toast.error(data.error || 'Error al eliminar la cuponera. Puede que tenga compras asociadas.');
      }
    } catch (e) {
      toast.error('Error de red al intentar eliminar la cuponera.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredUsuarios = sortData(usuarios.filter(u => u.rut.includes(searchUsuario) || u.nombre.toLowerCase().includes(searchUsuario.toLowerCase())));
  const filteredTx = sortData(transacciones.filter(t => t.rut_usuario.includes(searchTx) || (t.orden_compra && t.orden_compra.includes(searchTx))));
  const filteredCanjes = sortData(canjes.filter(c =>
    (c.rut_usuario && c.rut_usuario.includes(searchCanjes)) ||
    (c.nombre_usuario && c.nombre_usuario.toLowerCase().includes(searchCanjes.toLowerCase())) ||
    (c.pnr_kupos && c.pnr_kupos.includes(searchCanjes))
  ));
  const sortedCuponeras = sortData(cuponeras.filter(c =>
    c.nombre.toLowerCase().includes(searchCuponera.toLowerCase()) ||
    String(c.id).includes(searchCuponera)
  ));
  const filteredCompras = sortData(compras.filter(c =>
    (c.rut_usuario && c.rut_usuario.includes(searchCompras)) ||
    (c.Cuponera?.nombre && c.Cuponera.nombre.toLowerCase().includes(searchCompras.toLowerCase())) ||
    (c.Usuario?.nombre && c.Usuario.nombre.toLowerCase().includes(searchCompras.toLowerCase())) ||
    (c.nombre_usuario && c.nombre_usuario.toLowerCase().includes(searchCompras.toLowerCase())) ||
    String(c.id_cuponera).includes(searchCompras)
  ));
  const uniqueActionsAuditoria = Array.from(new Set(auditoria.map(a => a.accion))).filter(Boolean).sort();
  const filteredAuditoria = sortData(auditoria.filter(a => {
    const matchSearch = (a.rutUsuario && a.rutUsuario.includes(searchAuditoria)) ||
      (a.nombreUsuario && a.nombreUsuario.toLowerCase().includes(searchAuditoria.toLowerCase())) ||
      (a.accion && a.accion.toLowerCase().includes(searchAuditoria.toLowerCase())) ||
      (a.endpoint && a.endpoint.toLowerCase().includes(searchAuditoria.toLowerCase())) ||
      (a.id && a.id.toLowerCase().includes(searchAuditoria.toLowerCase()));
    const matchAction = filterAccionAuditoria === '' || a.accion === filterAccionAuditoria;
    return matchSearch && matchAction;
  }));

  return (
    <div className="space-y-6">
      {mounted && typeof document !== 'undefined' && createPortal(
        <Toaster position="top-right" toastOptions={{ style: { zIndex: 999999 } }} />,
        document.body
      )}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* SIDEBAR TABS */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-[#ff6700]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Mantenedor</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Administración</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <button onClick={() => setActiveTab('catalogo')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'catalogo' ? 'bg-[#ff6700] text-white shadow-md shadow-orange-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <ShoppingBag className={`w-5 h-5 ${activeTab === 'catalogo' ? 'text-white' : 'text-slate-400'}`} /> Catálogo
              </button>
              <button onClick={() => setActiveTab('usuarios')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'usuarios' ? 'bg-[#023caf] text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Users className={`w-5 h-5 ${activeTab === 'usuarios' ? 'text-white' : 'text-slate-400'}`} /> Usuarios
              </button>
              <button onClick={() => setActiveTab('transacciones')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'transacciones' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <CreditCard className={`w-5 h-5 ${activeTab === 'transacciones' ? 'text-white' : 'text-slate-400'}`} /> Pagos
              </button>
              <button onClick={() => setActiveTab('compras')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'compras' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Ticket className={`w-5 h-5 ${activeTab === 'compras' ? 'text-white' : 'text-slate-400'}`} /> Cuponeras
              </button>
              <button onClick={() => setActiveTab('canjes')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'canjes' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <ArrowLeftRight className={`w-5 h-5 ${activeTab === 'canjes' ? 'text-white' : 'text-slate-400'}`} /> Canjes
              </button>
              <button onClick={() => setActiveTab('auditoria')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'auditoria' ? 'bg-slate-800 text-white shadow-md shadow-slate-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <History className={`w-5 h-5 ${activeTab === 'auditoria' ? 'text-white' : 'text-slate-400'}`} /> Auditoría
              </button>
              <div className="h-px bg-slate-200 my-2"></div>
              <button onClick={() => setActiveTab('configuracion')} className={`w-full px-4 py-3 rounded-md text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'configuracion' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <Settings className={`w-5 h-5 ${activeTab === 'configuracion' ? 'text-white' : 'text-slate-400'}`} /> Banner UI
              </button>
            </nav>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 min-h-[600px] h-full">
            {/* CONTENT */}
        {activeTab === 'catalogo' && (
          <div className="flex flex-col gap-4 animate-fade-in lg:h-[calc(100vh-160px)]">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Search className="w-4 h-4 text-slate-400" />
                  Buscar:
                </div>
                <input type="text" placeholder="Nombre o ID..." value={searchCuponera} onChange={e => setSearchCuponera(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 w-64 focus:outline-none" />
                <button onClick={() => { fetchAdminData(); fetchExtraData(); }} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>
              <button onClick={handleOpenNew} className="bg-[#ff6700] text-white font-bold px-4 py-2 rounded-md text-xs flex items-center gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> Crear Nueva Cuponera
              </button>
            </div>
            
            {renderPagination(sortedCuponeras.length)}
            <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('id')}>
                      <div className="inline-flex items-center gap-1">ID {getSortIcon('id')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('nombre')}>
                      <div className="inline-flex items-center gap-1">Nombre {getSortIcon('nombre')}</div>
                    </th>
                    <th className="p-3">Tramos Habilitados</th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('valorUnitario')}>
                      <div className="inline-flex items-center gap-1">Valor Uni. {getSortIcon('valorUnitario')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('cantidadCupones')}>
                      <div className="inline-flex items-center gap-1">N° Cupones {getSortIcon('cantidadCupones')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('precioTotal')}>
                      <div className="inline-flex items-center gap-1">Precio Total {getSortIcon('precioTotal')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('activa')}>
                      <div className="inline-flex items-center gap-1">Publicada {getSortIcon('activa')}</div>
                    </th>
                    <th className="p-3 text-right w-28">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginate(sortedCuponeras).map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="p-3 font-mono font-bold text-slate-400">#{c.id}</td>
                      <td className="p-3 font-bold text-slate-900">{c.nombre}</td>
                      <td className="p-3 min-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {c.tramos.map((t: string, idx: number) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-semibold">${c.valorUnitario.toLocaleString('es-CL')}</td>
                      <td className="p-3 font-bold text-[#ff6700]">{c.cantidadCupones}</td>
                      <td className="p-3 font-black text-[#ff6700]">${c.precioTotal.toLocaleString('es-CL')}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${c.activa ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{c.activa ? 'Activa' : 'Inactiva'}</span></td>
                      <td className="p-3 text-right w-28">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Editar"
                            className="p-1.5 bg-blue-50 text-[#023caf] hover:bg-[#023caf] hover:text-white rounded-lg font-bold inline-flex items-center shadow-xs cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(c.id)}
                            title="Eliminar"
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg font-bold inline-flex items-center shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="flex flex-col gap-4 animate-fade-in lg:h-[calc(100vh-160px)]">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Search className="w-4 h-4 text-slate-400" />
                  Buscar Usuario:
                </div>
                <input type="text" placeholder="RUT o Nombre..." value={searchUsuario} onChange={e => setSearchUsuario(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 w-64 focus:outline-none" />
                <button onClick={() => { fetchAdminData(); fetchExtraData(); }} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>
            </div>
            {renderPagination(filteredUsuarios.length)}
            <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('rut')}>
                      <div className="inline-flex items-center gap-1">RUT {getSortIcon('rut')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('nombre')}>
                      <div className="inline-flex items-center gap-1">Nombre {getSortIcon('nombre')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('correo')}>
                      <div className="inline-flex items-center gap-1">Correo {getSortIcon('correo')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('telefono')}>
                      <div className="inline-flex items-center gap-1">Teléfono {getSortIcon('telefono')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('rol')}>
                      <div className="inline-flex items-center gap-1">Rol {getSortIcon('rol')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('createdAt')}>
                      <div className="inline-flex items-center gap-1">Registro {getSortIcon('createdAt')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginate(filteredUsuarios).map(u => (
                    <tr key={u.rut} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-[#023caf]">{u.rut}</td>
                      <td className="p-3 font-semibold">{u.nombre}</td>
                      <td className="p-3 text-slate-600">{u.correo}</td>
                      <td className="p-3 text-slate-600">{u.telefono || '-'}</td>
                      <td className="p-3 font-bold">{u.rol}</td>
                      <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transacciones' && (
          <div className="flex flex-col gap-4 animate-fade-in lg:h-[calc(100vh-160px)]">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Search className="w-4 h-4 text-slate-400" />
                  Buscar Transacción:
                </div>
                <input type="text" placeholder="Orden de compra o RUT..." value={searchTx} onChange={e => setSearchTx(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 w-64 focus:outline-none" />
                <button onClick={() => { fetchAdminData(); fetchExtraData(); }} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>
            </div>
            {renderPagination(filteredTx.length)}
            <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('orden_compra')}>
                      <div className="inline-flex items-center gap-1">Orden {getSortIcon('orden_compra')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('cuponera.nombre')}>
                      <div className="inline-flex items-center gap-1">Cuponera {getSortIcon('cuponera.nombre')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('nombre_usuario')}>
                      <div className="inline-flex items-center gap-1">Usuario {getSortIcon('nombre_usuario')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('monto')}>
                      <div className="inline-flex items-center gap-1">Monto {getSortIcon('monto')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('estado')}>
                      <div className="inline-flex items-center gap-1">Estado {getSortIcon('estado')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('codigo_autorizacion')}>
                      <div className="inline-flex items-center gap-1">Cod. Aut {getSortIcon('codigo_autorizacion')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('createdAt')}>
                      <div className="inline-flex items-center gap-1">Fecha {getSortIcon('createdAt')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginate(filteredTx).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-600">
                        {t.orden_compra ? t.orden_compra : <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">PRE-WEBPAY</span>}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{t.CuponeraCatalogo?.nombre || t.UsuarioCuponera?.Cuponera?.nombre || '-'}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{t.nombre_usuario ? fixEncoding(t.nombre_usuario) : '-'}</div>
                        <div className="font-mono text-[10px] text-[#023caf]">{t.rut_usuario}</div>
                      </td>
                      <td className="p-3 font-bold">${Number(t.monto).toLocaleString('es-CL')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-800' : t.estado === 'RECHAZADO' || t.estado === 'FALLIDO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                          {t.estado}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{t.codigo_autorizacion || '-'}</td>
                      <td className="p-3 text-slate-500">{new Date(t.createdAt).toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'compras' && (
          <div className="flex flex-col gap-4 animate-fade-in lg:h-[calc(100vh-160px)]">
            {(() => {
              const userMap = new Map();
              filteredCompras.forEach(c => {
                const rut = c.rut_usuario;
                if (!userMap.has(rut)) {
                  userMap.set(rut, {
                    rut,
                    nombre: c.Usuario?.nombre || c.nombre_usuario || 'Sin nombre registrado',
                    total: 0,
                    activas: 0,
                    inactivas: 0,
                    cuponeras: []
                  });
                }
                const user = userMap.get(rut);
                user.total += 1;

                const diffTime = new Date(c.fecha_expiracion).getTime() - new Date().getTime();
                const isVencida = diffTime < 0;

                if (c.activa && !isVencida) {
                  user.activas += 1;
                } else {
                  user.inactivas += 1;
                }
                user.cuponeras.push(c);
              });

              const groupedUsers = Array.from(userMap.values());
              const totalCuponeras = filteredCompras.length;
              const totalActivas = groupedUsers.reduce((sum, u) => sum + u.activas, 0);
              const totalInactivas = groupedUsers.reduce((sum, u) => sum + u.inactivas, 0);

              return (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Cuponeras</span>
                      <span className="text-2xl font-black text-slate-800">{totalCuponeras}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-md p-4 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Activas</span>
                      <span className="text-2xl font-black text-emerald-700">{totalActivas}</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-md p-4 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Inactivas / Vencidas</span>
                      <span className="text-2xl font-black text-rose-700">{totalInactivas}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Search className="w-4 h-4 text-slate-400" />
                        Buscar Usuario o Cuponera:
                      </div>
                      <input type="text" placeholder="Nombre o RUT..." value={searchCompras} onChange={e => setSearchCompras(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 w-64 focus:outline-none" />
                      <button onClick={() => { fetchAdminData(); fetchExtraData(); }} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                      </button>
                    </div>
                  </div>

                  {renderPagination(groupedUsers.length)}
                  <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th className="p-3">Usuario</th>
                          <th className="p-3 text-center">Total Cuponeras</th>
                          <th className="p-3 text-center">Activas</th>
                          <th className="p-3 text-center">Inactivas</th>
                          <th className="p-3 text-right">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupedUsers.length === 0 && (
                          <tr><td colSpan={5} className="p-4 text-center text-slate-500">No hay registros encontrados.</td></tr>
                        )}
                        {paginate(groupedUsers).map(user => (
                          <React.Fragment key={user.rut}>
                            <tr className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setExpandedUserCompras(prev => prev === user.rut ? null : user.rut)}>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{fixEncoding(user.nombre)}</div>
                                <div className="text-[10px] font-mono text-[#023caf]">{user.rut}</div>
                              </td>
                              <td className="p-3 text-center font-bold text-slate-700">{user.total}</td>
                              <td className="p-3 text-center font-bold text-emerald-600">{user.activas}</td>
                              <td className="p-3 text-center font-bold text-rose-600">{user.inactivas}</td>
                              <td className="p-3 text-right">
                                <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors inline-flex items-center justify-center">
                                  {expandedUserCompras === user.rut ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>
                            {expandedUserCompras === user.rut && (
                              <tr>
                                <td colSpan={5} className="bg-slate-50 p-0 border-t border-slate-100">
                                  <div className="px-6 py-4 bg-slate-50/50 shadow-inner">
                                    <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-wider">Cuponeras de {fixEncoding(user.nombre).split(' ')[0]}</h4>
                                    <div className="grid gap-2">
                                      {user.cuponeras.map((c: any) => {
                                        const cDiff = new Date(c.fecha_expiracion).getTime() - new Date().getTime();
                                        const cDays = Math.ceil(cDiff / (1000 * 60 * 60 * 24));
                                        const cVencida = cDays < 0;

                                        return (
                                          <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-xs">
                                            <div>
                                              <div className="font-bold text-slate-800">{c.Cuponera?.nombre || 'Cuponera N/A'}</div>
                                              <div className="text-[10px] text-slate-400 font-mono">ID Registro: #{c.id_cuponera}</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">Saldo</div>
                                              <div className="font-black text-[#ff6700]">{c.usos_restantes}</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">Estado</div>
                                              <span className={`px-2 py-0.5 mt-0.5 inline-block rounded-md text-[10px] font-bold ${c.activa && !cVencida ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                {c.activa && !cVencida ? 'Activa' : 'Inactiva / Vencida'}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">Expiración</div>
                                              <div className="text-xs text-slate-700">{new Date(c.fecha_expiracion).toLocaleDateString('es-CL')}</div>
                                              {!cVencida ? (
                                                <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">Quedan {cDays} días</div>
                                              ) : (
                                                <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">Vencida</div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'canjes' && (
          <div className="flex flex-col gap-4 animate-fade-in lg:h-[calc(100vh-160px)]">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Search className="w-4 h-4 text-slate-400" />
                  Buscar Canje:
                </div>
                <input type="text" placeholder="PNR, RUT o Nombre..." value={searchCanjes} onChange={e => setSearchCanjes(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 w-64 focus:outline-none" />
                <button onClick={() => { fetchAdminData(); fetchExtraData(); }} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                </button>
              </div>
            </div>
            {renderPagination(filteredCanjes.length)}
            <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('pnr_kupos')}>
                      <div className="inline-flex items-center gap-1">PNR Kupos {getSortIcon('pnr_kupos')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('cupon.codigo')}>
                      <div className="inline-flex items-center gap-1">Cod. Cupón {getSortIcon('cupon.codigo')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('cupon.UsuarioCuponera.Cuponera.nombre')}>
                      <div className="inline-flex items-center gap-1">Cuponera {getSortIcon('cupon.UsuarioCuponera.Cuponera.nombre')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('rut_usuario')}>
                      <div className="inline-flex items-center gap-1">RUT Pasajero {getSortIcon('rut_usuario')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('nombre_usuario')}>
                      <div className="inline-flex items-center gap-1">Nombre Pasajero {getSortIcon('nombre_usuario')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('origen')}>
                      <div className="inline-flex items-center gap-1">Ruta {getSortIcon('origen')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('asiento')}>
                      <div className="inline-flex items-center gap-1">Asiento {getSortIcon('asiento')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('estado')}>
                      <div className="inline-flex items-center gap-1">Estado {getSortIcon('estado')}</div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('fecha_viaje')}>
                      <div className="inline-flex items-center gap-1">Fecha Viaje {getSortIcon('fecha_viaje')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginate(filteredCanjes).map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{c.pnr_kupos}</td>
                      <td className="p-3 font-mono font-bold text-[#ff6700] bg-[#FFEDD5] px-2 py-1 rounded inline-block m-2 border border-[#FED7AA]">{c.Cupon?.codigo || '-'}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.Cupon?.UsuarioCuponera?.Cuponera?.nombre || 'Cuponera N/A'}</td>
                      <td className="p-3 font-mono">{c.rut_usuario}</td>
                      <td className="p-3 font-semibold text-slate-700">{c.nombre_usuario ? fixEncoding(c.nombre_usuario) : '-'}</td>
                      <td className="p-3 font-semibold">{c.origen} - {c.destino}</td>
                      <td className="p-3 font-mono">{c.asiento}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.estado === 'CONFIRMADO' ? 'bg-emerald-100 text-emerald-800' : c.estado === 'ANULADO' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(c.fecha_viaje).toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'auditoria' && (
          <div className="flex flex-col gap-4 animate-fade-in lg:h-[calc(100vh-160px)]">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
                  <Search className="w-4 h-4 text-slate-400" />
                  Auditoría
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="ID, Acción, Usuario o Endpoint..." value={searchAuditoria} onChange={e => setSearchAuditoria(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 w-48 focus:outline-none" />
                  <select 
                    value={filterAccionAuditoria} 
                    onChange={e => setFilterAccionAuditoria(e.target.value)} 
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="">Todas las acciones</option>
                    {uniqueActionsAuditoria.map(accion => (
                      <option key={accion} value={accion}>{accion}</option>
                    ))}
                  </select>
                  <button onClick={() => { fetchAdminData(); fetchExtraData(); }} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                  </button>
                </div>
              </div>
            </div>
            {renderPagination(filteredAuditoria.length)}
            <div className="border border-slate-200 rounded-lg flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group" onClick={() => requestSort('fechaHora')}>
                      <div className="inline-flex items-center gap-1">Fecha {getSortIcon('fechaHora')}</div>
                    </th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3">Payload</th>
                    <th className="p-3">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditoria.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No hay registros de trazabilidad y auditoría.</td>
                    </tr>
                  ) : (
                    paginate(filteredAuditoria).map(log => {
                      let badgeColor = 'bg-blue-100 text-blue-800';
                      if (log.accion === 'CANJE_CUPON') badgeColor = 'bg-emerald-100 text-emerald-800';
                      else if (log.accion === 'ANULACION_PASAJE' || (log.accion?.includes('ANULACION') && !log.accion?.startsWith('ERROR'))) badgeColor = 'bg-purple-100 text-purple-800';
                      else if (log.accion === 'COMPRA_CUPONERA') badgeColor = 'bg-[#023caf]/10 text-[#023caf]';
                      else if (log.accion === 'OTP_VALIDADO') badgeColor = 'bg-teal-100 text-teal-800';
                      else if (log.accion === 'OTP_GENERADO') badgeColor = 'bg-amber-100 text-amber-800';
                      else if (log.accion === 'CREACION_CUPONERA' || log.accion === 'EDICION_CUPONERA') badgeColor = 'bg-orange-100 text-orange-800';
                      else if (log.accion?.startsWith('ERROR')) badgeColor = 'bg-red-100 text-red-800';

                      const hasPayload = log.payload !== undefined && log.payload !== null && log.payload !== '';
                      const hasResponse = log.response !== undefined && log.response !== null && log.response !== '';

                      let payloadSnippet = '-';
                      if (hasPayload) {
                        payloadSnippet = typeof log.payload === 'object' ? JSON.stringify(log.payload) : String(log.payload);
                      } else if (log.detalles && !hasResponse) {
                        payloadSnippet = typeof log.detalles === 'object' ? JSON.stringify(log.detalles) : String(log.detalles);
                      }

                      let responseSnippet = '-';
                      if (hasResponse) {
                        responseSnippet = typeof log.response === 'object' ? JSON.stringify(log.response) : String(log.response);
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 align-top">
                          <td className="p-3">
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${badgeColor}`}>{log.accion}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800 whitespace-nowrap">{log.nombreUsuario ? fixEncoding(log.nombreUsuario) : '-'}</div>
                            <div className="font-mono text-[10px] text-slate-500">{log.rutUsuario || '-'}</div>
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(log.fechaHora).toLocaleString('es-CL')}</td>
                          <td className="p-3">
                            {log.endpoint ? (
                              <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded max-w-[200px] truncate block" title={log.endpoint}>
                                {log.endpoint}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[150px] block" title={payloadSnippet}>
                                {payloadSnippet}
                              </span>
                              {(hasPayload || (log.detalles && !hasResponse)) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAuditDrawer({
                                      isOpen: true,
                                      title: 'Payload (Datos Enviados)',
                                      type: 'payload',
                                      log,
                                      data: hasPayload ? log.payload : log.detalles
                                    });
                                    setCopiedJson(false);
                                  }}
                                  className="text-[10px] font-bold text-[#023caf] hover:text-[#023caf]/80 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer shadow-xs border border-blue-200"
                                >
                                  Ver más
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[150px] block" title={responseSnippet}>
                                {responseSnippet}
                              </span>
                              {hasResponse && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAuditDrawer({
                                      isOpen: true,
                                      title: 'Response (Respuesta Recibida)',
                                      type: 'response',
                                      log,
                                      data: log.response
                                    });
                                    setCopiedJson(false);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer shadow-xs border border-emerald-200"
                                >
                                  Ver más
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'configuracion' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#ff6700]" /> Configuración del Banner
            </h2>
            
            
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Imagen del Banner Principal (Hero)</label>
                <p className="text-xs text-slate-500 mb-3">Sube una imagen desde tu disco o ingresa una URL (la imagen subida tendrá prioridad).</p>
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-600 block mb-1">Subir Imagen:</span>
                    <label className="flex items-center justify-center w-full bg-slate-50 border-2 border-slate-300 border-dashed rounded-md px-4 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-center">
                      <span className="text-sm font-medium text-slate-500">
                        {bannerFile ? `Archivo seleccionado: ${bannerFile.name}` : 'Haz clic para seleccionar una imagen'}
                      </span>
                      <input 
                        key={bannerFile ? 'has-file' : 'no-file'}
                        type="file" 
                        accept="image/*"
                        onChange={e => e.target.files && e.target.files.length > 0 ? setBannerFile(e.target.files[0]) : setBannerFile(null)} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-600 block mb-1">O ingresar URL:</span>
                    <input 
                      type="text" 
                      value={bannerUrl} 
                      onChange={e => setBannerUrl(e.target.value)} 
                      placeholder="https://ejemplo.com/banner.jpg"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
                    />
                  </div>
                </div>
              </div>
              
              {(bannerUrl || bannerFile) && (
                <div className="mt-4 border border-slate-200 rounded-md overflow-hidden bg-slate-100">
                  <p className="text-xs font-bold text-slate-500 p-2 text-center border-b border-slate-200 bg-white">Vista Previa</p>
                  <img 
                    src={bannerFile ? URL.createObjectURL(bannerFile) : getFullImageUrl(bannerUrl)} 
                    alt="Banner Preview" 
                    className="w-full h-auto max-h-[300px] object-cover" 
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x300?text=Error+al+cargar+imagen'; }} 
                  />
                </div>
              )}
              
              <div className="pt-4 flex gap-4">
                <button 
                  onClick={saveConfig} 
                  disabled={savingConfig}
                  className="bg-[#ff6700] hover:bg-[#e65c00] text-white font-bold py-3 px-8 rounded-md shadow-md transition-all text-sm disabled:opacity-50"
                >
                  {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
                </button>
                {(bannerUrl || bannerFile) && (
                  <button 
                    onClick={removeBanner} 
                    disabled={savingConfig}
                    className="bg-white hover:bg-slate-50 text-red-600 border border-red-200 font-bold py-3 px-8 rounded-md shadow-sm transition-all text-sm disabled:opacity-50"
                  >
                    Eliminar Banner
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Modal Formulario Edición/Creación */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-full overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors">
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
            <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 pr-12">
              {editingId ? `Editar Cuponera #${editingId}` : 'Crear Nueva Cuponera'}
            </h3>
            <form onSubmit={handleSave} className="space-y-6 text-sm text-slate-700 font-medium mt-2">
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-x-12 gap-y-6">

                {/* Columna Izquierda */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-4">
                    <label className="sm:text-right font-bold text-slate-700">Nombre de la zona <span className="text-red-500">*</span></label>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-md px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]" placeholder="ej. CUPONERA LOS ANDES (10)" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-2 sm:gap-4">
                    <label className="sm:text-right font-bold text-slate-700 sm:mt-3">Combinación de ciudades</label>
                    <div className="space-y-3">
                      {tramosItems.map((tramo, index) => (
                        <div key={index} className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3 rounded-lg space-y-2.5">
                          {/* Fila Origen */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-slate-600 text-xs font-bold w-14 shrink-0 pl-1">Origen</span>
                            <div className="flex-1 min-w-0">
                              <ComboBox
                                items={cityItems}
                                value={tramo.origen}
                                onChange={(val) => setTramosItems(prev => prev.map((item, idx) => idx === index ? { ...item, origen: val } : item))}
                                placeholder="Selecciona origen"
                              />
                            </div>
                            <div className="w-[54px] shrink-0 invisible" aria-hidden="true" />
                          </div>

                          {/* Fila Destino */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-slate-600 text-xs font-bold w-14 shrink-0 pl-1">Destino</span>
                            <div className="flex-1 min-w-0">
                              <ComboBox
                                items={cityItems}
                                value={tramo.destino}
                                onChange={(val) => setTramosItems(prev => prev.map((item, idx) => idx === index ? { ...item, destino: val } : item))}
                                placeholder="Selecciona destino"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <button
                                type="button"
                                onClick={() => setTramosItems(prev => [...prev, { origen: '', destino: '' }])}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                                title="Agregar combinación"
                              >
                                <Plus className="w-6 h-6 bg-green-600 hover:bg-green-700 text-white rounded-md p-1 stroke-[3] shadow-sm transition-colors" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { if (tramosItems.length > 1) setTramosItems(prev => prev.filter((_, idx) => idx !== index)) }}
                                className={`focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer ${tramosItems.length <= 1 ? 'opacity-35 cursor-not-allowed hover:scale-100' : ''}`}
                                disabled={tramosItems.length <= 1}
                                title="Eliminar combinación"
                              >
                                <Minus className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-md p-1 stroke-[3] shadow-sm transition-colors" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-4">
                    <label className="sm:text-right font-bold text-slate-700">Monto del cupón</label>
                    <input type="number" required min="1" value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-md px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-4">
                    <label className="sm:text-right font-bold text-slate-700 uppercase">NÚMERO DE CUPONES</label>
                    <input type="number" required min="1" value={cantidadCupones} onChange={(e) => setCantidadCupones(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-md px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-4">
                    <label className="sm:text-right font-bold text-slate-700">Estado</label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="estado" checked={estadoActivo === 'Activo'} onChange={() => { setEstadoActivo('Activo'); setActiva(true); }} className="accent-[#ff6700] w-4 h-4 cursor-pointer" />
                        <span className={estadoActivo === 'Activo' ? 'font-bold text-slate-900' : 'text-slate-500'}>Activo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="estado" checked={estadoActivo === 'Inactivo'} onChange={() => { setEstadoActivo('Inactivo'); setActiva(false); }} className="accent-[#ff6700] w-4 h-4 cursor-pointer" />
                        <span className={estadoActivo === 'Inactivo' ? 'font-bold text-slate-900' : 'text-slate-500'}>Inactivo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-6 lg:pt-[76px] lg:pl-4">
                  <div className="flex items-center gap-4">
                    <label className="w-40 sm:w-36 sm:text-right font-bold text-slate-700">Tipo de asiento</label>
                    <select value={tipoAsiento} onChange={(e) => setTipoAsiento(e.target.value)} className="flex-1 bg-slate-50 border border-slate-300 rounded-md px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf] cursor-pointer appearance-none">
                      <option value="Todos">Todos</option>
                      <option value="Semi Cama">Semi Cama</option>
                      <option value="Salon Cama">Salón Cama</option>
                      <option value="Premium">Premium</option>
                      <option value="Clasico">Clásico</option>
                      <option value="Ejecutivo">Ejecutivo</option>
                      <option value="Cama Suite">Cama Suite</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="w-40 sm:w-36 sm:text-right font-bold text-slate-700">Boleto adicional</label>
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-md px-4 py-2 w-fit">
                      <button type="button" onClick={() => setBoletoAdicional(Math.max(0, boletoAdicional - 1))} className="text-white bg-[#ff6700] hover:bg-[#e65c00] w-6 h-6 rounded-md flex items-center justify-center font-bold text-lg leading-none p-0 pb-[2px] focus:outline-none transition-transform hover:scale-110 cursor-pointer shadow-sm">-</button>
                      <span className="font-black text-lg w-4 text-center">{boletoAdicional}</span>
                      <button type="button" onClick={() => setBoletoAdicional(boletoAdicional + 1)} className="text-white bg-[#ff6700] hover:bg-[#e65c00] w-6 h-6 rounded-md flex items-center justify-center font-bold text-lg leading-none p-0 pb-[1px] focus:outline-none transition-transform hover:scale-110 cursor-pointer shadow-sm">+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-center items-center gap-6 pt-10 pb-4">
                <button type="submit" disabled={saving} className="bg-[#ff6700] hover:bg-[#e65c00] text-white font-bold py-3 px-10 rounded-md shadow-md transition-all text-sm focus:outline-none cursor-pointer disabled:opacity-50">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-red-500 hover:text-red-700 font-bold text-sm focus:outline-none transition-colors cursor-pointer">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmación de Eliminación */}
      {mounted && deleteConfirmId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-md flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Cuponera?</h3>
            <p className="text-sm text-slate-600 mb-8">Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar permanentemente esta cuponera del sistema?</p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCuponera}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md shadow-lg shadow-rose-200 transition-colors cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Drawer Lateral de Auditoria */}
      {mounted && auditDrawer.isOpen && auditDrawer.log && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setAuditDrawer(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform animate-slide-left">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {auditDrawer.log.accion}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(auditDrawer.log.fechaHora).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 mt-1">
                    {auditDrawer.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditDrawer(prev => ({ ...prev, isOpen: false }))}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-bold text-slate-500 shrink-0">Endpoint:</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate" title={auditDrawer.log.endpoint}>
                    {auditDrawer.log.endpoint || 'No especificado'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {(auditDrawer.log.payload || auditDrawer.log.detalles) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditDrawer(prev => ({
                          ...prev,
                          title: 'Payload (Datos Enviados)',
                          type: 'payload',
                          data: prev.log?.payload || prev.log?.detalles
                        }));
                        setCopiedJson(false);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${auditDrawer.type === 'payload' ? 'bg-[#023caf] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      Payload
                    </button>
                  )}
                  {auditDrawer.log.response && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditDrawer(prev => ({
                          ...prev,
                          title: 'Response (Respuesta Recibida)',
                          type: 'response',
                          data: prev.log?.response
                        }));
                        setCopiedJson(false);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${auditDrawer.type === 'response' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      Response
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    Contenido JSON
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const text = typeof auditDrawer.data === 'string'
                        ? (auditDrawer.data.trim().startsWith('{') || auditDrawer.data.trim().startsWith('[')
                            ? JSON.stringify(JSON.parse(auditDrawer.data), null, 2)
                            : auditDrawer.data)
                        : JSON.stringify(auditDrawer.data, null, 2);
                      navigator.clipboard.writeText(text);
                      setCopiedJson(true);
                      toast.success('JSON copiado al portapapeles');
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Check className={`w-3.5 h-3.5 ${copiedJson ? 'text-emerald-400' : 'hidden'}`} />
                    <span>{copiedJson ? '¡Copiado!' : 'Copiar JSON'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[60vh] shadow-inner">
                  <pre className="whitespace-pre-wrap break-all">
                    {(() => {
                      try {
                        if (typeof auditDrawer.data === 'string') {
                          if (auditDrawer.data.trim().startsWith('{') || auditDrawer.data.trim().startsWith('[')) {
                            return JSON.stringify(JSON.parse(auditDrawer.data), null, 2);
                          }
                          return auditDrawer.data;
                        }
                        return JSON.stringify(auditDrawer.data, null, 2);
                      } catch {
                        return String(auditDrawer.data);
                      }
                    })()}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
