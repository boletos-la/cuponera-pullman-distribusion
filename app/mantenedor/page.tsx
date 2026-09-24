'use client';

import React, { useState, useEffect } from 'react';
import AdminMaintainer from '@/components/AdminMaintainer';
import { Lock, LogOut, ShieldCheck, ArrowLeft, KeyRound, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiClient';

export default function MantenedorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Comprobar si existe sesión activa en sessionStorage
    const authSession = sessionStorage.getItem('admin_authenticated');
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${getApiUrl()}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_token', data.token);
      } else {
        setErrorMsg(data.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased flex flex-col">
      {/* Header Superior del Mantenedor */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF6B00]" />
              <span>Volver al Portal</span>
            </Link>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <div>
              <span className="font-extrabold text-base text-white">PULLMAN </span>
              <span className="font-extrabold text-base text-[#FF6B00]">COSTA CENTRAL</span>
              <span className="text-xs text-slate-400 font-normal hidden sm:inline"> • Mantenedor Administrativo</span>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administrador</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* FORMULARIO DE INICIO DE SESIÓN */
          <div className="max-w-md mx-auto my-12 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-[#F05A24] text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-extrabold text-[#F05A24] uppercase tracking-wider block">
                  Acceso Privado / RUTA: /mantenedor
                </span>
                <h2 className="text-2xl font-black text-slate-900">Iniciar Sesión Administrador</h2>
                <p className="text-xs text-slate-500">
                  Ingresa tus credenciales para acceder al mantenedor de cuponeras y logs de auditoría.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5 text-white" />
                      <span>Ingresar al Mantenedor</span>
                    </>
                  )}
                </button>
              </form>

              {/* Asistente con credenciales de prueba */}
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block">💡 Credenciales de Acceso de Prueba:</span>
                <p className="text-xs font-mono font-bold text-[#F05A24]">
                  Usuario: <span className="text-slate-900">admin</span> • Clave: <span className="text-slate-900">pullman2026</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* MANTENEDOR ADMINISTRATIVO AUTENTICADO */
          <div className="animate-fade-in">
            <AdminMaintainer />
          </div>
        )}
      </main>
    </div>
  );
}
