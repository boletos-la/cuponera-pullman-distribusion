import React, { useState, useEffect } from 'react';
import { getAuthToken, getAuthUser, removeAuthToken, setAuthToken, apiClient } from '@/lib/apiClient';
import { KeyRound, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProfileTab() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [actualPassword, setActualPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden' });
      return;
    }
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
        <Loader2 className="w-10 h-10 text-[#fa5e00] animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Cargando perfil...</h3>
        <p className="text-sm text-slate-500 mt-1">Preparando tu configuración</p>
      </div>
    );
  }

  if (!user) return <div className="text-center p-8">No estás logueado</div>;

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#fa5e00]" />
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
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || email === user.correo}
            className="flex items-center gap-2 justify-center bg-[#023caf] hover:bg-[#083b82] text-white font-bold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar Correo
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#fa5e00]" />
          Actualizar Contraseña
        </h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Actual</label>
            <input
              type="password"
              required
              value={actualPassword}
              onChange={(e) => setActualPassword(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#023caf]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !actualPassword || !newPassword}
            className="flex items-center gap-2 justify-center bg-[#fa5e00] hover:bg-[#e55400] text-white font-bold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
