import React, { useState, useEffect } from 'react';
import { getAuthToken, getAuthUser, removeAuthToken, setAuthToken, apiClient } from '@/lib/apiClient';
import { KeyRound, Mail, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [actualPassword, setActualPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showActualPassword, setShowActualPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Validaciones en tiempo real
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordLengthValid = newPassword.length >= 8;
  const isPasswordFormatValid = /(?=.*[A-Z])(?=.*\d)/.test(newPassword);
  const isPasswordValid = isPasswordLengthValid && isPasswordFormatValid;
  const doPasswordsMatch = newPassword === confirmPassword && newPassword !== '';

  useEffect(() => {
    const authUser = getAuthUser();
    setUser(authUser);
    if (authUser?.correo) {
      setEmail(authUser.correo);
    }
    
    // Fake loading delay to avoid abrupt UI rendering
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await apiClient('/auth/email', {
        method: 'PUT',
        body: JSON.stringify({ nuevo_correo: email }),
      });
      setMessage({ type: 'success', text: 'Correo actualizado exitosamente. Por favor inicia sesión nuevamente.' });
      setTimeout(() => {
        removeAuthToken();
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar correo' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !doPasswordsMatch) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await apiClient('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ password_actual: actualPassword, nueva_password: newPassword }),
      });
      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente.' });
      setActualPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar contraseña' });
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="w-10 h-10 text-[#ff6700] animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Cargando perfil...</h3>
        <p className="text-sm text-slate-500 mt-1">Preparando tu configuración</p>
      </div>
    );
  }

  if (!user) return <div className="text-center p-8">No estás logueado</div>;

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-md text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#ff6700]" />
          Actualizar Correo
        </h3>
        <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nuevo Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full text-sm bg-slate-50 border rounded-md px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf] ${email && !isEmailValid ? 'border-red-400' : 'border-slate-300'}`}
            />
            {email && !isEmailValid && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">Formato de correo inválido.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || email === user.correo || !isEmailValid}
            className="flex items-center gap-2 justify-center bg-[#023caf] hover:bg-[#083b82] text-white font-bold py-2.5 px-6 rounded-md transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Correo
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#ff6700]" />
          Actualizar Contraseña
        </h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showActualPassword ? "text" : "password"}
                required
                value={actualPassword}
                onChange={(e) => setActualPassword(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-md pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
              />
              <button
                type="button"
                onClick={() => setShowActualPassword(!showActualPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showActualPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full text-sm bg-slate-50 border rounded-md pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf] ${newPassword && !isPasswordValid ? 'border-red-400' : 'border-slate-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 space-y-1">
                <p className={`text-[10px] font-semibold flex items-center gap-1 ${isPasswordLengthValid ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${isPasswordLengthValid ? 'text-emerald-500' : 'text-slate-300'}`} /> Mínimo 8 caracteres
                </p>
                <p className={`text-[10px] font-semibold flex items-center gap-1 ${isPasswordFormatValid ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3 h-3 ${isPasswordFormatValid ? 'text-emerald-500' : 'text-slate-300'}`} /> Al menos 1 mayúscula y 1 número
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full text-sm bg-slate-50 border rounded-md pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf] ${confirmPassword && !doPasswordsMatch ? 'border-red-400' : 'border-slate-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !doPasswordsMatch && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">Las contraseñas no coinciden.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !actualPassword || !newPassword || !isPasswordValid || !doPasswordsMatch}
            className="flex items-center gap-2 justify-center bg-[#ff6700] hover:bg-[#e65c00] text-white font-bold py-2.5 px-6 rounded-md transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
