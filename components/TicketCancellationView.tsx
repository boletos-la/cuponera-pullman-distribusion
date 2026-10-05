'use client';

import React, { useState } from 'react';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, KeyRound, Search, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { couponService } from '@/lib/services/couponService';

export default function TicketCancellationView() {
  const [pasajeCodigo, setPasajeCodigo] = useState('');
  const [rutInput, setRutInput] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rutError, setRutError] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [resultadoExitosa, setResultadoExitosa] = useState<{
    mensaje: string;
    cuponCodigoReintegrado: string;
  } | null>(null);

  // 1. Solicitar OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResultadoExitosa(null);

    const cleaned = cleanRut(rutInput);

    if (!pasajeCodigo || !rutInput) {
      setErrorMsg('Complete todos los campos requeridos.');
      return;
    }

    if (!validateRut(cleaned)) {
      setErrorMsg('RUT inválido según el algoritmo chileno Módulo 11.');
      return;
    }

    setLoading(true);
    try {
      const formattedRut = formatRut(cleaned);
      const res = await couponService.sendRedeemOtp(formattedRut, 'anulacion');
      if (res.success) {
        setStep('otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error conectando con el servidor para enviar OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar OTP y Anular
  const handleVerifyOtpAndCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpCode.length < 6) {
      setErrorMsg('El código OTP debe tener 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const formattedRut = formatRut(cleanRut(rutInput));
      const res = await couponService.cancelCoupon(pasajeCodigo, formattedRut, otpCode);

      if (!res.success) {
        setErrorMsg(res.message || 'No se pudo procesar la anulación.');
        return;
      }

      setResultadoExitosa({
        mensaje: res.message || 'Pasaje anulado correctamente.',
        cuponCodigoReintegrado: res.cuponCodigoReintegrado || pasajeCodigo
      });
      setStep('form');
      setPasajeCodigo('');
      setOtpCode('');

    } catch (err: any) {
      setErrorMsg(err.message || 'Error conectando con el servidor o código inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto space-y-6 mt-6 md:mt-8 pb-12">
      {/* Tarjeta Principal */}
      <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#fa5e00]" />
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#fa5e00] flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
            <RotateCcw className="w-8 h-8 text-[#fa5e00]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-[#fa5e00]">
              Anulación de Viaje
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Si tus planes cambiaron, puedes anular tu pasaje con al menos <strong className="text-slate-800">4 horas de anticipación</strong>. Tu cupón será devuelto a estado Activo.
            </p>
          </div>
        </div>

        {/* Banner Normativo Legal (Glassmorphism) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 to-orange-50/50 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-5 flex items-start gap-4 group hover:shadow-md transition-shadow duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
          <div className="bg-white/60 p-2 rounded-xl shadow-sm border border-white">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-xs sm:text-sm text-amber-900/90 space-y-1.5 pt-1">
            <span className="font-extrabold text-amber-950 block tracking-wide">Normativa de Transporte Terrestre</span>
            <p className="leading-relaxed">
              La anulación de pasajes sólo se autoriza si faltan <span className="font-black text-orange-600 bg-orange-100/50 px-1.5 py-0.5 rounded">4 horas o más</span> para la salida del servicio. Transcurrido ese plazo, el sistema bloquea automáticamente la anulación por ley.
            </p>
          </div>
        </div>

        {/* Modal / Card de Anulación Exitosa */}
        {resultadoExitosa && step === 'form' && (
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60 rounded-2xl p-8 text-center space-y-4 animate-fade-in shadow-sm">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl" />
            <div className="w-16 h-16 rounded-full bg-white text-emerald-500 flex items-center justify-center mx-auto shadow-sm border border-emerald-100 ring-4 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="text-xl font-black text-emerald-950 tracking-tight">¡Anulación Completada con Éxito!</h3>
              <p className="text-sm font-medium text-emerald-800/80">{resultadoExitosa.mensaje}</p>
            </div>

            <div className="inline-block bg-white border border-emerald-100 px-5 py-3 rounded-xl shadow-sm relative z-10 mt-2">
              <span className="block text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Comprobante de Reintegro</span>
              <span className="text-sm font-mono font-black text-[#023caf]">
                1 uso reintegrado (Cupón: {resultadoExitosa.cuponCodigoReintegrado})
              </span>
            </div>
          </div>
        )}

        {/* Formulario Principal */}
        {step === 'form' && (
          <form onSubmit={handleRequestOtp} className="space-y-5 relative z-10">
            <div className="bg-slate-50/50 rounded-2xl p-5 sm:p-6 border border-slate-100 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 ml-1">RUT del Comprador <span className="text-orange-500">*</span></label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    placeholder="ej: 12.345.678-K"
                    value={rutInput}
                    onChange={(e) => {
                      const formatted = formatRut(e.target.value);
                      setRutInput(formatted);
                      const cleaned = cleanRut(e.target.value);
                      if (cleaned.length >= 8) {
                        if (!validateRut(cleaned)) {
                          setRutError('RUT inválido. Verifique el dígito verificador.');
                        } else {
                          setRutError('');
                        }
                      } else {
                        setRutError('');
                      }
                      setErrorMsg('');
                    }}
                    className={`w-full text-sm font-semibold bg-white border-2 rounded-xl pl-11 pr-4 py-3.5 transition-all duration-300 focus:outline-none focus:ring-4 text-slate-800 placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm ${
                      rutError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200/80 focus:border-[#023caf] focus:ring-[#023caf]/10'
                    }`}
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 transition-colors group-focus-within:text-[#023caf]" />
                </div>
                {rutError && <p className="text-xs text-red-600 font-medium ml-1">{rutError}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 ml-1">Código del Pasaje (PNR) a Anular <span className="text-orange-500">*</span></label>
                <div className="relative group">
                  <input
                    type="text"
                    required
                    placeholder="ej. ASD1234 o Boleto"
                    value={pasajeCodigo}
                    onChange={(e) => setPasajeCodigo(e.target.value.toUpperCase())}
                    className="w-full text-sm font-mono font-bold bg-white border-2 border-slate-200/80 rounded-xl pl-4 pr-11 py-3.5 transition-all duration-300 focus:outline-none focus:border-[#fa5e00] focus:ring-4 focus:ring-[#fa5e00]/10 text-slate-800 placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm uppercase tracking-wider"
                  />
                  <div className="absolute right-4 top-3.5 p-1 bg-slate-100 rounded-md">
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 font-medium space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 font-black text-red-900 tracking-tight">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Anulación Bloqueada o No Permitida</span>
                </div>
                <p className="pl-6 text-red-700/90">{errorMsg}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !pasajeCodigo || !rutInput || !!rutError}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-[#fa5e00] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-black py-4 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(250,94,0,0.39)] hover:shadow-[0_6px_20px_rgba(250,94,0,0.23)] transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                      Anular Viaje
                      <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Paso OTP */}
        {step === 'otp' && (
          <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-8 shadow-sm border border-slate-200/60 space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-3 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#fa5e00] flex items-center justify-center mx-auto shadow-inner border border-orange-200/50 relative z-10 rotate-3 hover:rotate-0 transition-transform duration-300">
                <KeyRound className="w-10 h-10 stroke-[2]" />
              </div>
              <div className="space-y-1 relative z-10">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Validación 2FA</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Ingresa el código de 6 dígitos enviado a tu <span className="font-bold text-slate-700">correo registrado</span>.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtpAndCancel} className="space-y-6 max-w-sm mx-auto relative z-10">
              <div className="space-y-2 text-center">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Código OTP de Seguridad
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-4xl tracking-[0.2em] font-black bg-white border-2 border-slate-200 rounded-2xl py-4 transition-all duration-300 focus:outline-none focus:border-[#fa5e00] focus:ring-4 focus:ring-[#fa5e00]/10 text-slate-800 placeholder:text-slate-200 shadow-sm"
                  placeholder="------"
                />
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200/60 rounded-xl text-xs text-red-700 font-medium space-y-1.5 text-left shadow-sm">
                  <div className="flex items-center gap-2 font-black text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Error de validación</span>
                  </div>
                  <p className="pl-6 text-red-800/80">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full bg-gradient-to-r from-[#023caf] to-[#01256e] hover:from-[#01256e] hover:to-[#011a4d] text-white font-black py-4 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(2,60,175,0.39)] hover:shadow-[0_6px_20px_rgba(2,60,175,0.23)] transition-all duration-300 flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5 text-blue-200" />
                      <span>Confirmar y Anular Pasaje</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setOtpCode('');
                    setErrorMsg('');
                  }}
                  className="w-full text-slate-500 hover:text-slate-800 font-bold text-sm py-3 cursor-pointer transition-colors hover:bg-slate-100 rounded-xl"
                >
                  Cancelar y Volver
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
