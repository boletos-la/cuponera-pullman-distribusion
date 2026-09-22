'use client';

import React, { useState } from 'react';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';
import { RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, ArrowLeft, KeyRound, Search } from 'lucide-react';
import { couponService } from '@/lib/services/couponService';

export default function TicketCancellationView() {
  const [pasajeCodigo, setPasajeCodigo] = useState('');
  const [rutInput, setRutInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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
      const res = await couponService.sendRedeemOtp(formattedRut);
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

        {step === 'form' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RUT del Comprador *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="ej: 12.345.678-K"
                  value={rutInput}
                  onChange={(e) => {
                    setRutInput(formatRut(e.target.value));
                    setErrorMsg('');
                  }}
                  className="w-full text-sm font-semibold bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24] text-[#0F172A]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>



            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código del Pasaje (PNR) a Anular *</label>
              <input
                type="text"
                required
                placeholder="ej. ASD1234 o Boleto"
                value={pasajeCodigo}
                onChange={(e) => setPasajeCodigo(e.target.value.toUpperCase())}
                className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
              />
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
              disabled={loading || !pasajeCodigo || !rutInput}
              className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 text-white" />
                  <span>Solicitar Código 2FA</span>
                </>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#FFE4D6] space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-[#FFF5F0] text-[#F05A24] flex items-center justify-center mx-auto shadow-md">
                <KeyRound className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Validación para Anular</h3>
              <p className="text-xs text-slate-500">
                Hemos enviado un código de 6 dígitos a tu <span className="font-semibold text-slate-700">correo registrado</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpAndCancel} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                  Código OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-48 mx-auto text-center text-2xl tracking-widest font-black bg-white border border-slate-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
                />
              </div>
              
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium space-y-1 text-left">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Error al anular:</span>
                  </div>
                  <p className="pl-6">{errorMsg}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full bg-[#F05A24] hover:bg-orange-600 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirmar Anulación</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-slate-500 hover:text-slate-700 font-semibold text-xs py-2 cursor-pointer"
              >
                Volver
              </button>
            </form>
          </div>
        )}

        {/* Modal / Card de Anulación Exitosa */}
        {resultadoExitosa && step === 'form' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-emerald-900">¡Anulación Completada con Éxito!</h3>
            <p className="text-xs text-emerald-800">{resultadoExitosa.mensaje}</p>

            <div className="inline-block bg-white border border-emerald-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#0A4DA6]">
              1 uso reintegrado a su cuponera (Cupón devuelto: {resultadoExitosa.cuponCodigoReintegrado})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
