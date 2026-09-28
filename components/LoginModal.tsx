import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, LogIn, AlertCircle } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { setAuthToken } from '@/lib/apiClient';
import { validateRut, formatRut, cleanRut } from '@/lib/rutValidator';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      setError(err.message || 'Error de red o credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#FFF5F0] text-[#F05A24] flex items-center justify-center mx-auto shadow-md">
            <LogIn className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Iniciar Sesión</h3>
          <p className="text-xs text-slate-500">
            Ingresa a tu cuenta para gestionar tus cuponeras.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">RUT *</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña *</label>
            <input
              type="password"
              required
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A4DA6]"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!rutError}
            className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
