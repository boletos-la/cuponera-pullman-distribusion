import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, AlertCircle, UserPlus, KeyRound, ArrowRight, ArrowLeft, Mail, Phone, Lock, User, ShieldCheck } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { setAuthToken } from '@/lib/apiClient';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

type Mode = 'login' | 'register' | 'mfa';

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestHint, setGuestHint] = useState('');

  // Form Fields
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [password, setPassword] = useState('');
  
  // Extra Register Fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // OTP Field
  const [otpCode, setOtpCode] = useState('');

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRut(raw);
    setRut(formatted);

    const cleaned = cleanRut(raw);
    if (cleaned.length >= 8) {
      if (!validateRut(cleaned)) {
        setRutError('RUT inválido (Verifique el dígito verificador).');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const handleRutBlur = async () => {
    if (mode !== 'register') return;
    const cleaned = cleanRut(rut);
    if (cleaned.length >= 8 && validateRut(cleaned)) {
      try {
        const res = await authService.checkRut(cleaned);
        if (res.success && res.exists && res.isGuest) {
          if (res.nombre && !nombre) setNombre(res.nombre);
          if (res.correo_ofuscado) {
            setGuestHint(`Hemos encontrado tu registro como invitado. Ingresa el correo asociado (${res.correo_ofuscado}) para validar tu cuenta.`);
          }
        } else {
          setGuestHint('');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rutError || !rut || !password) {
      setError('Por favor complete los campos correctamente.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login({ rut: cleanRut(rut), password });
      if (res.success && res.token) {
        setAuthToken(res.token);
        onLoginSuccess();
        onClose();
      } else {
        setError(res.message || 'Error al iniciar sesión.');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas o usuario no registrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rutError || !rut || !nombre || !email || !password || !passwordConfirm) {
      setError('Todos los campos obligatorios deben estar completos.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      setError('La contraseña debe contener al menos una mayúscula y un número.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // Send OTP to the email provided for MFA validation
      const res = await authService.sendOtp({ rut: cleanRut(rut), email, nombre, isRegister: true });
      if (res.success) {
        setMode('mfa');
      } else {
        setError(res.message || 'Error al enviar código de verificación.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length < 6) {
      setError('Ingrese el código completo de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verificar OTP
      const otpRes = await authService.verifyOtp({ rut: cleanRut(rut), otpCode });
      if (!otpRes.success) {
        setError(otpRes.message || 'Código inválido o expirado.');
        setLoading(false);
        return;
      }

      // 2. Si el OTP es válido, procedemos a registrar
      const regRes = await authService.register({
        rut: cleanRut(rut),
        nombre,
        correo: email,
        telefono,
        password
      });

      if (!regRes.success) {
        setError(regRes.message || 'Error al completar el registro.');
        setLoading(false);
        return;
      }

      // 3. Auto Login tras registro exitoso
      const loginRes = await authService.login({ rut: cleanRut(rut), password });
      if (loginRes.success && loginRes.token) {
        setAuthToken(loginRes.token);
        onLoginSuccess();
        onClose();
      } else {
        setMode('login'); // Fallback a manual login
      }
    } catch (err: any) {
      setError(err.message || 'Error procesando la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (mode === 'mfa') setMode('register');
    else if (mode === 'register') setMode('login');
    setError('');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white rounded-[2rem] w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative transition-all duration-300 ${mode === 'register' ? 'max-w-lg' : 'max-w-sm'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {mode !== 'login' && (
          <button
            onClick={goBack}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* --- LOGIN MODE --- */}
        {mode === 'login' && (
          <div className="animate-fade-in-up">
            <div className="text-center space-y-2 mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-[#fa5e00] flex items-center justify-center mx-auto shadow-inner border border-orange-200/50">
                <LogIn className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight pt-2">Iniciar Sesión</h3>
              <p className="text-xs font-medium text-slate-500">
                Accede a tu cuenta para gestionar tus cuponeras oficiales.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 ml-1">RUT *</label>
                <input
                  type="text"
                  required
                  placeholder="12.345.678-K"
                  value={rut}
                  onChange={handleRutChange}
                  className={`w-full text-sm font-semibold bg-slate-50 border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 transition-all ${
                    rutError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300 focus:border-[#023caf] focus:ring-[#023caf]/10'
                  }`}
                />
                {rutError && <p className="text-xs text-red-600 font-bold ml-1">{rutError}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 ml-1">Contraseña *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-[#023caf]/10 focus:border-[#023caf] hover:border-slate-300 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !!rutError || !rut || !password}
                  className="w-full bg-gradient-to-r from-[#fa5e00] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-black py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(250,94,0,0.39)] hover:shadow-[0_6px_20px_rgba(250,94,0,0.23)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Entrar a mi Cuenta</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-500 font-medium">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-[#023caf] font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
        )}

        {/* --- REGISTER MODE --- */}
        {mode === 'register' && (
          <div className="animate-fade-in-up">
            <div className="text-center space-y-2 mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#023caf] flex items-center justify-center mx-auto shadow-inner border border-blue-200/50">
                <UserPlus className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight pt-2">Crear Cuenta</h3>
              <p className="text-xs font-medium text-slate-500">
                Regístrate de forma segura. Validaremos tu correo electrónico.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 ml-1">RUT *</label>
                  <input
                    type="text"
                    required
                    placeholder="12.345.678-K"
                    value={rut}
                    onChange={handleRutChange}
                    onBlur={handleRutBlur}
                    className={`w-full text-sm font-semibold bg-slate-50 border-2 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 transition-all ${
                      rutError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-[#023caf] focus:ring-[#023caf]/10'
                    }`}
                  />
                  {rutError && <p className="text-[10px] text-red-600 font-bold ml-1">{rutError}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 ml-1">Nombre Completo *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Nombre y Apellidos"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#023caf]/10 focus:border-[#023caf] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 ml-1">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#023caf]/10 focus:border-[#023caf] transition-all"
                    />
                  </div>
                  {guestHint && <p className="text-[10px] text-[#023caf] font-bold ml-1">{guestHint}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 ml-1">Teléfono Móvil</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#023caf]/10 focus:border-[#023caf] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 ml-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mín 8, 1 mayúscula, 1 número"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#023caf]/10 focus:border-[#023caf] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 ml-1">Repetir Contraseña *</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirma tu contraseña"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full text-sm font-semibold bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#023caf]/10 focus:border-[#023caf] transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !!rutError}
                  className="w-full bg-gradient-to-r from-[#023caf] to-[#01256e] hover:from-[#01256e] hover:to-[#011a4d] text-white font-black py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(2,60,175,0.39)] hover:shadow-[0_6px_20px_rgba(2,60,175,0.23)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Siguiente: Validar Correo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- MFA / OTP MODE --- */}
        {mode === 'mfa' && (
          <div className="animate-fade-in-up">
            <div className="text-center space-y-2 mb-6 mt-2 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 text-[#fa5e00] flex items-center justify-center mx-auto shadow-inner border border-orange-200/50 relative z-10">
                <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight pt-2 relative z-10">Validación de Correo</h3>
              <p className="text-xs font-medium text-slate-500 relative z-10">
                Hemos enviado un código de 6 dígitos a <br/>
                <span className="font-bold text-slate-700">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-5 relative z-10">
              <div className="space-y-1.5 text-center">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Código OTP de Seguridad
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl tracking-[0.3em] font-black bg-white border-2 border-slate-200 rounded-2xl py-3 focus:outline-none focus:border-[#fa5e00] focus:ring-4 focus:ring-[#fa5e00]/10 text-slate-800 placeholder:text-slate-200 shadow-sm transition-all"
                  placeholder="------"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full bg-gradient-to-r from-[#fa5e00] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-black py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(250,94,0,0.39)] hover:shadow-[0_6px_20px_rgba(250,94,0,0.23)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Verificar y Crear Cuenta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

