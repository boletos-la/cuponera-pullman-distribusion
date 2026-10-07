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
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased flex flex-col">
      {/* Header Superior del Mantenedor */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-[#00c7cc]" />
              <span className="hidden sm:inline">Volver</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <img src="/logo-boletos.png" alt="Pullman Cuponeras" className="h-8 object-contain" />
              <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />
              <img src="/logo-wit-dark.png" alt="WIT" className="h-7 object-contain" />
              <span className="text-xs text-slate-400 font-bold hidden sm:inline border-l border-slate-200 pl-3 ml-1">Mantenedor</span>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-md font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Administrador</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-md shadow-sm transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* FORMULARIO DE INICIO DE SESIÓN */
          <div className="max-w-md mx-auto my-12 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-lg bg-[#F05A24] text-white flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
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
                    className="w-full text-sm font-semibold bg-slate-50 border border-slate-300 rounded-md px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
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
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-md px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#F05A24]"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F05A24] hover:bg-[#D94B18] text-white font-extrabold py-3.5 px-4 rounded-md shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-md animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5 text-white" />
                      <span>Ingresar al Mantenedor</span>
                    </>
                  )}
                </button>
              </form>

              {/* Asistente con credenciales de prueba */}
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-lg p-4 text-center space-y-1">
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
