'use client';

import React, { useState } from 'react';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function TicketCancellationView() {
  const [pasajeCodigo, setPasajeCodigo] = useState('');
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [resultadoExitosa, setResultadoExitosa] = useState<{
    mensaje: string;
    cuponCodigoReintegrado: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setRutError('');
    setResultadoExitosa(null);

    if (!pasajeCodigo || !rut) {
      setErrorMsg('Complete todos los campos requeridos.');
      return;
    }

    const cleanedRut = cleanRut(rut);
    if (!validateRut(cleanedRut)) {
      setRutError('RUT inválido según algoritmo chileno Módulo 11.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cupones/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pasajeCodigo,
          rut: cleanedRut
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'No se pudo procesar la anulación.');
        return;
      }

      setResultadoExitosa({
        mensaje: data.mensaje,
        cuponCodigoReintegrado: data.cuponCodigoReintegrado
      });

    } catch (err) {
      setErrorMsg('Error conectando con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <span className="bg-amber-50 text-amber-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Proceso E • Regla Legal de 4 Horas
          </span>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <RotateCcw className="w-6 h-6 text-[#F05A24]" />
            Anulación de Viaje y Reintegro de Cupón
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Si tus planes cambiaron, puedes anular tu viaje con al menos 4 horas de anticipación a la salida del bus. Tu cupón será reintegrado a estado <span className="font-bold text-emerald-600">Activo</span> en tu saldo.
          </p>
        </div>

        {/* Banner Normativo Legal */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Normativa de Transporte Terrestre:</span>
            <p>
              La anulación de pasajes sólo se autoriza si faltan <span className="font-extrabold text-[#F05A24]">4 horas o más</span> para la salida del servicio. Transcurrido ese plazo, el sistema bloquea automáticamente la anulación por ley.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Código del Pasaje *</label>
            <input
              type="text"
              required
              placeholder="ej. TKT-94821"
              value={pasajeCodigo}
              onChange={(e) => setPasajeCodigo(e.target.value.toUpperCase())}
              className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">RUT del Titular del Pasaje * (Módulo 11)</label>
            <input
              type="text"
              required
              placeholder="12.345.678-K"
              value={rut}
              onChange={(e) => {
                setRut(formatRut(e.target.value));
                setRutError('');
              }}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
            />
            {rutError && <p className="text-xs text-red-600 font-medium mt-1">{rutError}</p>}
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Anulación Bloqueada o No Permitida:</span>
              </div>
              <p className="pl-6">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pasajeCodigo || !rut}
            className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RotateCcw className="w-5 h-5 text-white" />
                <span>Validar Regla 4h y Anular Pasaje</span>
              </>
            )}
          </button>
        </form>

        {/* Modal / Card de Anulación Exitosa */}
        {resultadoExitosa && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-emerald-900">¡Anulación Completada con Éxito!</h3>
            <p className="text-xs text-emerald-800">{resultadoExitosa.mensaje}</p>

            <div className="inline-block bg-white border border-emerald-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#0A4DA6]">
              Cupón Reintegrado: {resultadoExitosa.cuponCodigoReintegrado} (Estado: Activo)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
