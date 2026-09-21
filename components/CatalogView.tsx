'use client';

import React, { useState, useEffect } from 'react';
import { Cuponera, Compra, Cupon } from '@/lib/dataStore';
import { couponService } from '@/lib/services/couponService';
import { paymentService } from '@/lib/services/paymentService';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { ShoppingCart, Check, AlertCircle, ShieldCheck, Ticket, Sparkles, Filter, CreditCard, ArrowRight, X, CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getAuthUser } from '@/lib/apiClient';

interface CatalogViewProps {
  onGoToDashboardWithRut: (rut: string) => void;
  onGoToCanjeWithCupon?: (cupon: string, rut: string) => void;
}

export default function CatalogView({ onGoToDashboardWithRut, onGoToCanjeWithCupon }: CatalogViewProps) {
  const [cuponeras, setCuponeras] = useState<Cuponera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de Compra y Checkout
  const [selectedCuponera, setSelectedCuponera] = useState<Cuponera | null>(null);
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(true);
  const [simularRechazo, setSimularRechazo] = useState(false);
  const [rutError, setRutError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resultado de Compra Aprobada
  const [compraExitosa, setCompraExitosa] = useState<{
    compra: Compra;
    rutFormateado: string;
    cupones: Cupon[];
  } | null>(null);

  const [showTransbankSuccess, setShowTransbankSuccess] = useState(false);
  const [showTransbankError, setShowTransbankError] = useState(false);
  const [transbankErrorMessage, setTransbankErrorMessage] = useState('');

  useEffect(() => {
    fetchCuponeras();
    
    // Verificar si venimos de un pago exitoso o fallido
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      setShowTransbankSuccess(true);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('payment_error') === 'true') {
      const reason = params.get('reason');
      if (reason === 'cancelled') {
        setTransbankErrorMessage('El pago fue anulado por el usuario.');
      } else {
        setTransbankErrorMessage('Hubo un error al procesar el pago o fue rechazado por el banco.');
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

    setSubmitting(true);
    try {
      if (selectedCuponera) {
        const res = await paymentService.initPayment({ 
          id_cuponera: selectedCuponera.id,
          rut,
          email,
          nombre,
          telefono,
          frontend_url: window.location.origin
        });
        if (res.success && res.data.redirect_url && res.data.token_ws) {
          // Transbank requiere que enviemos el token_ws mediante un POST form oculto a la redirect_url
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

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#0A4DA6]" />
              Catálogo Oficial de Cuponeras (19 Opciones)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Fase 1: Pasos 1 al 7 del Flujo End-to-End. Selecciona tu paquete y congela tus tarifas 90 días.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por ciudad o tramo (ej. Viña, Concón)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A4DA6]"
            />
          </div>
        </div>

        {/* Chips de Categorías */}
        <div className="flex overflow-x-auto gap-2 pt-1 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F05A24] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas de Cuponeras */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-[#0A4DA6] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Cargando catálogo oficial de cuponeras...</p>
        </div>
      ) : filteredCuponeras.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center space-y-3 border border-slate-200">
          <AlertCircle className="w-10 h-10 text-orange-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No se encontraron cuponeras</h3>
          <p className="text-xs text-slate-500">Prueba ajustando el filtro o la palabra clave de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCuponeras.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-[#0A4DA6] shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Encabezado Tarjeta */}
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="bg-[#FFF7ED] text-[#F05A24] border border-[#FFEDD5] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    Item #{item.id} • {item.cantidadCupones} Cupones
                  </span>
                  {item.badge && (
                    <span className="bg-[#F05A24] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-[#F05A24] transition-colors leading-snug">
                    {item.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.descripcion}</p>
                </div>

                {/* Tramos Habilitados */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Tramos Habilitados ({item.tramos.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.tramos.map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pie de Tarjeta con Precio y Botón */}
              <div className="p-6 pt-0 border-t border-slate-100 mt-4 space-y-4">
                <div className="flex justify-between items-end pt-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Valor Unitario</span>
                    <span className="text-lg font-extrabold text-slate-800">
                      ${(item.valorUnitario || 0).toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-500">/ viaje</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Precio Total Paquete</span>
                    <span className="text-2xl font-black text-[#F05A24]">
                      ${(item.precioTotal || 0).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenCheckout(item)}
                  className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer transform hover:-translate-y-0.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Comprar Cuponera</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- MODAL DE CHECKOUT Y PASARELA WEBPAY ---------------- */}
      {selectedCuponera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Flujo E2E • Pasos 3, 4 y 5</span>
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
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Paso 3: Datos de Identidad del Titular
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. María González Tapia"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A4DA6]"
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
                    className={`w-full text-sm bg-slate-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 ${
                      rutError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-[#0A4DA6]'
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
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A4DA6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil</label>
                    <input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A4DA6]"
                    />
                  </div>
                </div>
              </div>

              {/* Paso 4: Condiciones de Compra */}
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="condiciones"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-0.5 rounded text-[#F05A24] focus:ring-[#F05A24]"
                  />
                  <label htmlFor="condiciones" className="text-xs text-slate-700 font-medium leading-tight">
                    Acepto las condiciones de compra: Los cupones emitidos tienen una{' '}
                    <span className="font-bold text-[#F05A24]">vigencia exacta de 90 días corridos</span> y sólo son válidos para los tramos contratados ({selectedCuponera.tramos.join(', ')}).
                  </label>
                </div>
              </div>

              {/* Toggle de Simulación Excepción 1 (Pago Rechazado) */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Probador de Excepción #1</span>
                    <span className="text-[11px] text-amber-700">Simular rechazo en pasarela Webpay</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simularRechazo}
                  onChange={(e) => setSimularRechazo(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
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
                    <span>Conectando con Webpay Plus...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar ${selectedCuponera.precioTotal.toLocaleString('es-CL')} CLP en Webpay</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL DE COMPROBANTE EXITOSO (PASO 7) ---------------- */}
      {compraExitosa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
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
                <span className="font-bold text-[#0A4DA6]">{compraExitosa.compra.nombreCuponera}</span>
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
                    <span className="bg-white text-[#0A4DA6] text-sm font-mono font-black px-3 py-1.5 rounded-lg border border-blue-200 inline-block shadow-xs">
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
                className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-bold py-3 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Ticket className="w-4 h-4 text-white" />
                <span>Ver en Mi Dashboard</span>
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
        </div>
      )}

      {/* Modal de Éxito Transbank Webpay */}
      {showTransbankSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center text-white relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold">¡Pago Exitoso!</h3>
              <p className="text-emerald-50 text-sm mt-1 opacity-90">
                Tu cuponera ha sido activada
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-5 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                <p className="text-slate-600 text-sm leading-relaxed">
                  El pago a través de Transbank se completó correctamente y tus pasajes ya se encuentran disponibles en tu cuenta.
                </p>
                <div className="mt-4 inline-block bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-200">
                  Estado: Aprobado
                </div>
              </div>

              {/* Botón Acción */}
              <button
                onClick={() => setShowTransbankSuccess(false)}
                className="w-full bg-[#0A4DA6] hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Aceptar y Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error Transbank Webpay */}
      {showTransbankError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center text-white relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold">Pago Fallido</h3>
              <p className="text-red-50 text-sm mt-1 opacity-90">
                No se pudo procesar tu compra
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-5 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {transbankErrorMessage}
                </p>
                <div className="mt-4 inline-block bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200">
                  Estado: Rechazado o Anulado
                </div>
              </div>

              {/* Botón Acción */}
              <button
                onClick={() => setShowTransbankError(false)}
                className="w-full bg-[#0A4DA6] hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
