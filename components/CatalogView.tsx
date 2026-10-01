'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cuponera, Compra, Cupon } from '@/lib/dataStore';
import { couponService } from '@/lib/services/couponService';
import { paymentService } from '@/lib/services/paymentService';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { ShoppingCart, Check, AlertCircle, ShieldCheck, Ticket, Sparkles, Filter, CreditCard, ArrowRight, X, CheckCircle, XCircle, KeyRound, Mail, LayoutGrid, List, Bus, RotateCcw, Star, MapPin, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { authService } from '@/lib/services/authService';
import { getAuthUser, setAuthToken } from '@/lib/apiClient';

interface CatalogViewProps {
  onGoToDashboardWithRut: (rut: string) => void;
  onGoToCanjeWithCupon?: (cupon: string, rut: string) => void;
}

export default function CatalogView({ onGoToDashboardWithRut, onGoToCanjeWithCupon }: CatalogViewProps) {
  const [cuponeras, setCuponeras] = useState<Cuponera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<string>('default');

  // Modal de Compra y Checkout
  const [selectedCuponera, setSelectedCuponera] = useState<Cuponera | null>(null);
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(true);
  const [rutError, setRutError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quiereRegistrarse, setQuiereRegistrarse] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showOtpCheckout, setShowOtpCheckout] = useState(false);
  const [otpCodeCheckout, setOtpCodeCheckout] = useState('');

  // Resultado de Compra Aprobada
  const [compraExitosa, setCompraExitosa] = useState<{
    compra: Compra;
    rutFormateado: string;
    cupones: Cupon[];
  } | null>(null);

  const [showTransbankSuccess, setShowTransbankSuccess] = useState(false);
  const [showTransbankError, setShowTransbankError] = useState(false);
  const [transbankErrorMessage, setTransbankErrorMessage] = useState('');
  const [pendingPurchaseData, setPendingPurchaseData] = useState<{
    rut: string;
    nombre: string;
    email: string;
    telefono?: string;
    idCuponera?: number;
    nombreCuponera?: string;
    cantidadCupones?: number;
    precioTotal?: number;
    tramos?: string[];
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCuponera || showTransbankSuccess || showTransbankError) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCuponera, showTransbankSuccess, showTransbankError]);

  useEffect(() => {
    fetchCuponeras();

    // Verificar si venimos de un pago exitoso o fallido
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      try {
        const saved = sessionStorage.getItem('pending_purchase');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPendingPurchaseData(parsed);
          sessionStorage.removeItem('pending_purchase');
        }
      } catch (e) {
        console.error('Error recuperando pending_purchase:', e);
      }
      setShowTransbankSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (params.get('payment_error') === 'true') {
      try {
        const saved = sessionStorage.getItem('pending_purchase');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPendingPurchaseData(parsed);
        }
      } catch (e) {
        console.error('Error recuperando pending_purchase:', e);
      }
      const reason = params.get('reason');
      if (reason === 'cancelled') {
        setTransbankErrorMessage('La transacción fue cancelada por el usuario en Webpay.');
      } else if (reason === 'rejected') {
        setTransbankErrorMessage('El pago fue rechazado por el banco emisor o la tarjeta.');
      } else {
        setTransbankErrorMessage('Hubo un problema al procesar la transacción o la sesión ha expirado.');
      }
      setShowTransbankError(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchCuponeras = async () => {
    setLoading(true);
    try {
      const res = await couponService.getCatalog();
      if (res.success) {
        // Mapeo de la respuesta del backend a la interfaz Cuponera esperada por el UI
        const mappedData = res.data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          descripcion: c.descripcion || '',
          tramos: c.tramos || [],
          valorUnitario: c.valorUnitario,
          cantidadCupones: c.cantidadCupones,
          precioTotal: c.precioTotal,
          activa: c.activa,
          categoria: c.categoria || 'Todos',
          badge: c.badge
        }));
        setCuponeras(mappedData);
      }
    } catch (err) {
      console.error('Error al cargar cuponeras:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRut(raw);
    setRut(formatted);

    const cleaned = cleanRut(raw);
    if (cleaned.length >= 8) {
      if (!validateRut(cleaned)) {
        setRutError('RUT inválido (Verifique el dígito verificador Módulo 11).');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const handleOpenCheckout = (c: Cuponera) => {
    setSelectedCuponera(c);
    setSubmitError('');
    setRutError('');
    setQuiereRegistrarse(false);
    setPassword('');
    setPasswordConfirm('');
    setShowOtpCheckout(false);
    setOtpCodeCheckout('');

    // Pre-cargar datos del usuario si está autenticado
    const authUser = getAuthUser();
    if (authUser) {
      if (authUser.nombre) setNombre(authUser.nombre);
      if (authUser.rut) setRut(formatRut(authUser.rut));
      if (authUser.correo) setEmail(authUser.correo);
    }
  };

  const handleCloseCheckout = () => {
    setSelectedCuponera(null);
  };

  const handleProcessPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!nombre || !rut || !email) {
      setSubmitError('Por favor complete los campos obligatorios.');
      return;
    }

    if (!validateRut(rut)) {
      setRutError('El RUT ingresado no es válido.');
      return;
    }

    if (!aceptaTerminos) {
      setSubmitError('Debe aceptar las condiciones de vigencia de 90 días.');
      return;
    }

    if (quiereRegistrarse) {
      if (password.length < 8) {
        setSubmitError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
        setSubmitError('La contraseña debe contener al menos una mayúscula y un número.');
        return;
      }
      if (password !== passwordConfirm) {
        setSubmitError('Las contraseñas no coinciden.');
        return;
      }

      if (!showOtpCheckout) {
        setSubmitting(true);
        try {
          const res = await authService.sendOtp({ rut: formatRut(rut), email, nombre, isRegister: true });
          if (res.success) {
            setShowOtpCheckout(true);
          } else {
            setSubmitError(res.message || 'Error al enviar código OTP.');
          }
        } catch (err: any) {
          setSubmitError(err.message || 'Error de conexión al solicitar OTP.');
        } finally {
          setSubmitting(false);
        }
        return; // Detenemos aquí, esperamos que el usuario ponga el OTP y vuelva a enviar
      } else {
        if (otpCodeCheckout.length < 6) {
          setSubmitError('Ingrese el código completo de 6 dígitos.');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (quiereRegistrarse && showOtpCheckout) {
        // Registrar usuario con OTP
        const regRes = await authService.register({ rut, nombre, correo: email, telefono, password, otpCode: otpCodeCheckout });
        if (!regRes.success) {
          setSubmitError(regRes.message || 'Error al registrar la cuenta.');
          setSubmitting(false);
          return;
        }
        if (regRes.token) {
          setAuthToken(regRes.token, true);
        }
      }

      if (selectedCuponera) {
        try {
          sessionStorage.setItem('pending_purchase', JSON.stringify({
            rut, nombre, email, telefono,
            idCuponera: selectedCuponera.id,
            nombreCuponera: selectedCuponera.nombre,
            cantidadCupones: selectedCuponera.cantidadCupones,
            precioTotal: selectedCuponera.precioTotal,
            tramos: selectedCuponera.tramos
          }));
        } catch (storageErr) { }

        const res = await paymentService.initPayment({
          id_cuponera: selectedCuponera.id,
          rut, email, nombre, telefono,
          frontend_url: window.location.origin
        });

        if (res.success && res.data.redirect_url && res.data.token_ws) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = res.data.redirect_url;
          const tokenInput = document.createElement('input');
          tokenInput.type = 'hidden';
          tokenInput.name = 'token_ws';
          tokenInput.value = res.data.token_ws;
          form.appendChild(tokenInput);
          document.body.appendChild(form);
          form.submit();
          return;
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error conectando con el servidor de pagos.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de cuponeras
  const categories = ['Todos', 'Viña del Mar', 'Concón', 'Valparaíso', 'Litoral Central', 'Marga Marga', 'Quillota', 'San Antonio', 'Aconcagua', 'Puerto Montt'];

  const filteredCuponeras = cuponeras.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tramos.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'Todos') return matchesSearch;
    if (selectedCategory === 'Viña del Mar') return matchesSearch && (c.nombre.includes('VIÑA') || c.categoria.includes('Viña'));
    if (selectedCategory === 'Concón') return matchesSearch && c.nombre.includes('CONCON');
    if (selectedCategory === 'Valparaíso') return matchesSearch && c.nombre.includes('VALPARAISO');
    if (selectedCategory === 'Litoral Central') return matchesSearch && (c.nombre.includes('LITORAL') || c.nombre.includes('CARTAGENA'));
    if (selectedCategory === 'Marga Marga') return matchesSearch && c.nombre.includes('ALEMANA');
    if (selectedCategory === 'Quillota') return matchesSearch && c.nombre.includes('LIMACHE');
    if (selectedCategory === 'San Antonio') return matchesSearch && c.nombre.includes('SAN ANTONIO');
    if (selectedCategory === 'Aconcagua') return matchesSearch && (c.nombre.includes('LOS ANDES') || c.nombre.includes('VALPO-LOS ANDES'));
    if (selectedCategory === 'Puerto Montt') return matchesSearch && (c.nombre.includes('PUERTO MONTT') || c.categoria.includes('Puerto Montt'));

    return matchesSearch;
  });

  // Ordenamiento
  const availableBadges = Array.from(new Set(cuponeras.map(c => c.badge).filter(Boolean))) as string[];
  let displayCuponeras = [...filteredCuponeras];
  if (sortBy.startsWith('badge_')) {
    const targetBadge = sortBy.replace('badge_', '');
    displayCuponeras.sort((a, b) => {
      if (a.badge === targetBadge && b.badge !== targetBadge) return -1;
      if (a.badge !== targetBadge && b.badge === targetBadge) return 1;
      return 0;
    });
  } else if (sortBy === 'price_asc') {
    displayCuponeras.sort((a, b) => (a.precioTotal || 0) - (b.precioTotal || 0));
  } else if (sortBy === 'price_desc') {
    displayCuponeras.sort((a, b) => (b.precioTotal || 0) - (a.precioTotal || 0));
  }

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#023caf]" />
              Catálogo Oficial de Cuponeras (19 Opciones)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Fase 1: Pasos 1 al 7 del Flujo End-to-End. Selecciona tu paquete y congela tus tarifas 90 días.
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar por ciudad o tramo (ej. Viña, Concón)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf] text-slate-700 font-medium"
            >
              <option value="default">Recomendados</option>
              {availableBadges.map((b) => (
                <option key={b} value={`badge_${b}`}>
                  {b}
                </option>
              ))}
              <option value="price_asc">Menor Precio</option>
              <option value="price_desc">Mayor Precio</option>
            </select>

            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'grid' ? 'bg-white text-[#023caf] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <LayoutGrid className="w-4 h-4" /> Tarjetas
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'table' ? 'bg-white text-[#023caf] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <List className="w-4 h-4" /> Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Chips de Categorías */}
        <div className="flex overflow-x-auto gap-2 pt-1 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                  ? 'bg-[#fa5e00] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Cuponeras (Grid o Tabla) */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-[#023caf] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando catálogo oficial de cuponeras...</p>
        </div>
      ) : filteredCuponeras.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center space-y-3 border border-slate-200">
          <AlertCircle className="w-10 h-10 text-orange-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No se encontraron cuponeras</h3>
          <p className="text-xs text-slate-500">Prueba ajustando el filtro o la palabra clave de búsqueda.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3">Cuponera</th>
                <th className="px-4 py-3">Tramos</th>
                <th className="px-4 py-3 text-center">Cupones</th>
                <th className="px-4 py-3 text-right">V. Unitario</th>
                <th className="px-4 py-3 text-right">V. Total</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayCuponeras.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 py-4 min-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-900 group-hover:text-[#fa5e00] transition-colors">{item.nombre}</span>
                      {item.badge && (
                        <span className="w-max bg-[#fa5e00] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 min-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {item.tramos.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                          {t}
                        </span>
                      ))}
                      {item.tramos.length > 3 && (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                          +{item.tramos.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-[#FFF7ED] text-[#fa5e00] font-bold text-xs px-2 py-1 rounded-lg border border-[#FFEDD5]">
                      {item.cantidadCupones}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-sm text-slate-700">
                    ${(item.valorUnitario || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-[#fa5e00] text-base">
                    ${(item.precioTotal || 0).toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleOpenCheckout(item)}
                      className="bg-[#fa5e00] hover:bg-[#e55400] text-white font-bold py-2 px-3 rounded-xl shadow-sm transition-all text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Comprar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-4">
          {displayCuponeras.map((item) => (
            <div
              key={item.id}
              className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-slate-100 flex flex-col mt-4"
            >
              {/* Badge "Mejor precio" u otro */}
              {item.badge && (
                <div className="absolute -top-3 right-4 bg-[#FFE8E0] text-[#fa5e00] font-bold text-xs px-2.5 py-1 rounded-full shadow-sm border border-white z-10">
                  {item.badge}
                </div>
              )}

              {/* Card Content */}
              <div className="p-5 pb-4 flex-1 flex flex-col">
                {/* Logo textual */}
                <div className="text-[#fa5e00] font-black text-xl tracking-tighter mb-1.5">
                  pullmanbus
                </div>

                {/* Nombre de la Cuponera */}
                <h3 className="text-base font-black text-slate-900 leading-snug mb-2">
                  {item.nombre}
                </h3>

                {/* Route details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Target className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-medium">{item.tramos[0]?.split(/\s*-\s*/)[0]?.trim() || 'Santiago'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-medium">{item.tramos[0]?.split(/\s*-\s*/)[1]?.trim() || item.tramos[0]?.split(/\s*-\s*/)[0]?.trim() || 'Destino'}</span>
                  </div>

                  {/* Validez */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-100 inline-flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Válido por 90 días
                    </div>
                    
                    {/* Info Tooltip */}
                    <div className="relative group flex items-center">
                      <button className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-help">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 bg-[#023caf]/70 backdrop-blur-md text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 border border-white/20">
                        <div className="font-bold mb-1 text-blue-100 uppercase tracking-wider">Tramos Habilitados:</div>
                        <ul className="list-disc pl-3 space-y-0.5 font-medium">
                          {item.tramos.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                        <div className="absolute -bottom-1 right-2 w-2 h-2 bg-[#023caf]/70 rotate-45 border-b border-r border-white/20"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto"></div>

                {/* Quantity and Unit Price */}
                <div className="flex justify-between items-end text-slate-800">
                  <span className="font-extrabold text-sm">{item.cantidadCupones} x pasajes</span>
                  <span className="font-extrabold text-base">${(item.valorUnitario || 0).toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Footer Button con Llamado a la Acción (CTA) */}
              <button
                onClick={() => handleOpenCheckout(item)}
                className="bg-[#fa5e00] text-white w-full rounded-b-2xl px-5 py-3 flex justify-between items-center font-black text-xs hover:bg-[#e55400] transition-all group cursor-pointer shadow-inner"
              >
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider">TOTAL</span>
                  <span className="text-base font-black leading-tight">CLP ${(item.precioTotal || 0).toLocaleString('es-CL')}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white text-[#fa5e00] group-hover:bg-orange-50 px-4 py-2 rounded-full text-xs font-black shadow-sm group-hover:scale-105 transition-all">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Comprar</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- MODAL DE CHECKOUT Y PASARELA WEBPAY ---------------- */}
      {mounted && selectedCuponera && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6 animate-fade-in relative">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedCuponera.nombre}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCuponera.cantidadCupones} viajes • Total: ${selectedCuponera.precioTotal.toLocaleString('es-CL')} CLP
                </p>
              </div>
              <button
                onClick={handleCloseCheckout}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPurchase} className="space-y-4">
              {/* Formulario de Datos del Comprador */}
              <div className="space-y-3">
                {/* Título removido */}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. María González Tapia"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RUT Titular * (Validación Módulo 11)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-K"
                    value={rut}
                    onChange={handleRutChange}
                    className={`w-full text-sm bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 ${rutError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-[#023caf]'
                      }`}
                  />
                  {rutError && <p className="text-xs text-red-600 font-medium mt-1">{rutError}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="cliente@ejemplo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil</label>
                    <input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
                    />
                  </div>
                </div>
              </div>

              {!getAuthUser() && (
                <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="quiereRegistrarse"
                    checked={quiereRegistrarse}
                    onChange={(e) => setQuiereRegistrarse(e.target.checked)}
                    disabled={showOtpCheckout}
                    className="mt-0.5 rounded text-[#fa5e00] focus:ring-[#fa5e00]"
                  />
                  <label htmlFor="quiereRegistrarse" className="text-xs text-slate-700 font-bold leading-tight">
                    ¿No tienes una cuenta? Regístrate para gestionar tus cuponeras fácilmente
                  </label>
                </div>
                {quiereRegistrarse && !showOtpCheckout && (
                  <div className="pt-2 pl-6 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
                      <input
                        type="password"
                        required={quiereRegistrarse}
                        placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Repetir Contraseña</label>
                      <input
                        type="password"
                        required={quiereRegistrarse}
                        placeholder="Repite tu contraseña"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
                      />
                    </div>
                  </div>
                )}
                {quiereRegistrarse && showOtpCheckout && (
                  <div className="pt-2 pl-6 space-y-3">
                    <div className="p-3 bg-white border border-[#fa5e00] rounded-xl shadow-sm">
                      <p className="text-xs text-slate-600 mb-2">
                        Te hemos enviado un código de 6 dígitos a <b>{email}</b>. Ingrésalo para verificar tu cuenta y continuar con el pago.
                      </p>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCodeCheckout}
                        onChange={(e) => setOtpCodeCheckout(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.5em] font-mono text-lg bg-slate-50 border border-[#fa5e00] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#fa5e00]"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowOtpCheckout(false)} 
                        className="text-[11px] text-slate-500 font-medium underline mt-2 w-full text-center hover:text-slate-700 cursor-pointer"
                      >
                        Cambiar contraseña o volver atrás
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Paso 4: Condiciones de Compra */}
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="condiciones"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-0.5 rounded text-[#fa5e00] focus:ring-[#fa5e00]"
                  />
                  <label htmlFor="condiciones" className="text-xs text-slate-700 font-medium leading-tight">
                    Acepto las condiciones de compra: Los cupones emitidos tienen una{' '}
                    <span className="font-bold text-[#fa5e00]">vigencia exacta de 90 días corridos</span> y sólo son válidos para los tramos contratados ({selectedCuponera.tramos.join(', ')}).
                  </label>
                </div>
              </div>
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Paso 5: Botón Pagar con Webpay */}
              <button
                type="submit"
                disabled={submitting || !!rutError}
                className="w-full bg-gradient-to-r from-[#FF6B00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validando y conectando...</span>
                  </>
                ) : showOtpCheckout ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Confirmar código y Proceder al Pago</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Proceder al Pago</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------- MODAL DE COMPROBANTE EXITOSO (PASO 7) ---------------- */}
      {mounted && compraExitosa && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-fade-in relative">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Paso 6 y 7: Compra Registrada y Cupones Emitidos
              </span>
              <h3 className="text-2xl font-black text-slate-900">¡Pago Aprobado en Webpay!</h3>
              <p className="text-xs text-slate-500">
                Se envió el comprobante al correo <span className="font-semibold text-slate-700">{compraExitosa.compra.emailCliente}</span>.
              </p>
            </div>

            {/* Resumen de la Orden */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">N° de Orden</span>
                <span className="font-bold text-slate-900">{compraExitosa.compra.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Titular / RUT</span>
                <span className="font-bold text-slate-900">{compraExitosa.compra.nombreCliente} ({compraExitosa.rutFormateado})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Cuponera</span>
                <span className="font-bold text-[#023caf]">{compraExitosa.compra.nombreCuponera}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Saldo Inicial</span>
                <span className="font-bold text-[#FF6B00]">
                  {compraExitosa.compra.cantidadCupones}/{compraExitosa.compra.cantidadCupones} Cupones Disponibles
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-medium">Vencimiento Exacto</span>
                <span className="font-bold text-red-600">
                  {new Date(compraExitosa.compra.fechaVencimiento).toLocaleDateString('es-CL')} (90 Días)
                </span>
              </div>
            </div>

            {/* Código de Cuponera Adquirida */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Código de Cuponera Emitida:
              </span>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                {compraExitosa.cupones.map((c) => (
                  <div key={c.codigo} className="space-y-1">
                    <span className="bg-white text-[#023caf] text-sm font-mono font-black px-3 py-1.5 rounded-lg border border-blue-200 inline-block shadow-xs">
                      {c.codigo}
                    </span>
                    <p className="text-xs text-emerald-800 font-bold mt-1">
                      Saldo: {c.saldoDisponible ?? c.totalCupones ?? compraExitosa.compra.cantidadCupones}/{c.totalCupones ?? compraExitosa.compra.cantidadCupones} viajes disponibles
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones Siguientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  const rutLocal = compraExitosa.compra.rutCliente;
                  setCompraExitosa(null);
                  onGoToDashboardWithRut(rutLocal);
                }}
                className="w-full bg-[#fa5e00] hover:bg-[#e55400] text-white font-bold py-3 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Ticket className="w-4 h-4 text-white" />
                <span>Ver en Mis cuponeras</span>
              </button>

              {onGoToCanjeWithCupon && (
                <button
                  onClick={() => {
                    const primerCupon = compraExitosa.cupones[0]?.codigo || '';
                    const rutLocal = compraExitosa.compra.rutCliente;
                    setCompraExitosa(null);
                    onGoToCanjeWithCupon(primerCupon, rutLocal);
                  }}
                  className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-bold py-3 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Canjear Primer Pasaje</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Éxito Transbank Webpay */}
      {mounted && showTransbankSuccess && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-fade-in">
            {/* Botón Cerrar */}
            <button
              onClick={() => {
                setShowTransbankSuccess(false);
                setPendingPurchaseData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Modal */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-[#FFF7ED] text-[#fa5e00] border border-[#FFEDD5] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <Bus className="w-3.5 h-3.5 text-[#fa5e00]" />
                <span>Pullman Bus Cuponeras</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
                Pago Aprobado y Cuponera Activada
              </span>
              <h3 className="text-2xl font-black text-slate-900">¡Pago Exitoso en Webpay!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {pendingPurchaseData?.email ? (
                  <>Se envió el comprobante y detalle de compra a <span className="font-semibold text-slate-700">{pendingPurchaseData.email}</span>.</>
                ) : (
                  <>Tu compra en Webpay Plus se completó correctamente y tus pasajes ya están disponibles para su uso inmediato.</>
                )}
              </p>
            </div>

            {/* Resumen de la Orden */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-medium">Estado de Transacción</span>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Aprobada por Transbank
                </span>
              </div>

              {pendingPurchaseData ? (
                <>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Cuponera</span>
                    <span className="font-bold text-[#023caf] text-right">{pendingPurchaseData.nombreCuponera}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Titular / RUT</span>
                    <span className="font-bold text-slate-900 text-right">{pendingPurchaseData.nombre} ({pendingPurchaseData.rut})</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Pasajes Disponibles</span>
                    <span className="font-bold text-[#FF6B00]">
                      {pendingPurchaseData.cantidadCupones} viajes listos para canjear
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Total Pagado</span>
                    <span className="font-black text-slate-900">
                      ${(pendingPurchaseData.precioTotal || 0).toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-500 font-medium">Vigencia</span>
                    <span className="font-bold text-slate-700">90 días corridos</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Medio de Pago</span>
                    <span className="font-bold text-[#023caf]">Webpay Plus (Transbank)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Disponibilidad</span>
                    <span className="font-bold text-emerald-600">Inmediata</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-500 font-medium">Vigencia</span>
                    <span className="font-bold text-slate-700">90 días corridos</span>
                  </div>
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  const targetRut = pendingPurchaseData?.rut;
                  setShowTransbankSuccess(false);
                  setPendingPurchaseData(null);
                  if (targetRut) {
                    onGoToDashboardWithRut(targetRut);
                  }
                }}
                className="w-full bg-[#fa5e00] hover:bg-[#e55400] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <Ticket className="w-4 h-4 text-white" />
                <span>Ver en Mis cuponeras</span>
              </button>

              <button
                onClick={() => {
                  setShowTransbankSuccess(false);
                  setPendingPurchaseData(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-200 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Volver al Catálogo</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Error Transbank Webpay */}
      {mounted && showTransbankError && createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative animate-fade-in">
            {/* Botón Cerrar */}
            <button
              onClick={() => {
                setShowTransbankError(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera del Modal */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-xs mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Transacción No Procesada</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 text-red-500 flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-8 h-8 stroke-[2.5]" />
              </div>

              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">
                Webpay Plus / Transbank
              </span>
              <h3 className="text-2xl font-black text-slate-900">Pago No Realizado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No te preocupes, no se ha efectuado ningún cobro ni descuento en tu medio de pago.
              </p>
            </div>

            {/* Resumen del Error */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs text-left">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-medium">Estado del Pago</span>
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Rechazado o Cancelado
                </span>
              </div>

              <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-medium shrink-0">Motivo:</span>
                <span className="font-semibold text-slate-800 text-right ml-2">{transbankErrorMessage}</span>
              </div>

              {pendingPurchaseData && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500 font-medium">Cuponera Intentada</span>
                  <span className="font-bold text-[#023caf] text-right">{pendingPurchaseData.nombreCuponera}</span>
                </div>
              )}

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#023caf] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Puedes intentar nuevamente seleccionando otro medio de pago o verificar que tu banco tenga habilitadas las compras en línea.
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowTransbankError(false);
                  if (pendingPurchaseData?.idCuponera) {
                    const cup = cuponeras.find(c => c.id === pendingPurchaseData.idCuponera);
                    if (cup) {
                      handleOpenCheckout(cup);
                    }
                  }
                }}
                className="w-full bg-[#fa5e00] hover:bg-[#e55400] text-white font-bold py-3.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span>Reintentar Compra</span>
              </button>

              <button
                onClick={() => {
                  setShowTransbankError(false);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-200 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
