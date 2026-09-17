"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";
import { useRouter } from "next/router";

export type UserRole =
  | "superuser"
  | "admin"
  | "empresa"
  | "subusuario"
  | "auditoria"
  | "contralor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyEstado?: boolean;
  companyRecargo?: number;
  companyPorcentajeDevolucion?: string;
  centroCostoId?: string;
  centroCostoName?: string;
  centroCostoEstado?: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  requiresVerification: boolean;
  requiresPasswordUpdate: boolean; // Nuevo campo
  passwordUpdateReason?: string; // Nuevo campo
  passwordUpdateUserId?: number; // Nuevo campo
  validationError?: string; // Nuevo campo
  pendingUserId: number | null;
  pendingUserEmail: string | null;
  verificationEmailSent: boolean;

  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  login: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    requiresVerification?: boolean;
    requiresPasswordUpdate?: boolean;
    passwordUpdateReason?: string;
    passwordUpdateUserId?: number;
    validationError?: string;
    message?: string;
  }>;

  verifyOtp: (code: string) => Promise<{ success: boolean; message?: string }>;

  resendOtp: () => Promise<{ success: boolean; message?: string }>;

  setPendingUserEmail: (email: string | null) => void;

  clearVerificationState: () => void;

  clearPasswordUpdateState: () => void;

  logout: () => void;
  getToken: () => string | null;

  changeCompany: (nuevaEmpresaId: string) => Promise<{
    success: boolean;
    message?: string;
    user?: User;
    token?: string;
    empresa?: any;
    centroCosto?: any;
  }>;
}

export interface TokenPayload {
  exp: number;
  iat: number;
  id: number;
  email: string;
  rol: string;
  empresa_id?: number;
  centro_costo_id?: number;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      requiresVerification: false,
      requiresPasswordUpdate: false,
      passwordUpdateReason: undefined,
      passwordUpdateUserId: undefined,
      validationError: undefined,
      pendingUserId: null,
      pendingUserEmail: null,
      verificationEmailSent: false,

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (email: string, password: string) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            // Si hay un error específico de actualización de contraseña
            if (data.requiresPasswordUpdate) {
              set({
                requiresPasswordUpdate: true,
                passwordUpdateReason: data.reason,
                passwordUpdateUserId: data.userId,
                validationError: data.validationError,
                user: {
                  id: String(data.userId || "0"),
                  email: email,
                  name: "", // No tenemos el nombre aquí
                  role: "empresa", // Rol por defecto
                },
              });

              return {
                success: false,
                requiresPasswordUpdate: true,
                passwordUpdateReason: data.reason,
                passwordUpdateUserId: data.userId,
                validationError: data.validationError,
                message: data.message,
              };
            }
            return { success: false, message: data.message };
          }

          if (data.requiresVerification) {
            set({
              requiresVerification: true,
              pendingUserId: data.userId,
              pendingUserEmail: data.user?.email || email,
              verificationEmailSent: true,
              user: {
                id: String(data.user.id),
                email: data.user.email,
                name: data.user.nombre,
                role: data.user.rol,
              },
            });

            return {
              success: true,
              requiresVerification: true,
              message: "Código de verificación enviado",
            };
          }

          const user: User = {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.nombre,
            role: data.user.rol,
            companyId: data.empresa ? String(data.empresa.id) : undefined,
            companyName: data.empresa?.nombre,
            companyEstado: data.empresa?.estado,
            companyRecargo: data.empresa?.recargo,
            companyPorcentajeDevolucion: data.empresa?.porcentaje_devolucion,
            centroCostoId: data.centroCosto
              ? String(data.centroCosto.id)
              : undefined,
            centroCostoName: data.centroCosto?.nombre,
            centroCostoEstado: data.centroCosto?.estado,
          };

          set({
            token: data.token,
            user,
            isAuthenticated: true,
            requiresVerification: false,
            requiresPasswordUpdate: false,
            passwordUpdateReason: undefined,
            passwordUpdateUserId: undefined,
            validationError: undefined,
            pendingUserId: null,
            pendingUserEmail: null,
            verificationEmailSent: false,
          });

          return { success: true, message: "Login exitoso" };
        } catch (err) {
          console.error("login error:", err);
          return { success: false, message: "No hay conexión con el servidor" };
        }
      },

      verifyOtp: async (code: string) => {
        const { pendingUserId } = get();
        if (!pendingUserId) {
          return { success: false, message: "No hay verificación pendiente" };
        }

        try {
          const res = await fetch("/api/auth/verify-2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: pendingUserId, code }),
          });

          const data = await res.json();

          if (!res.ok) {
            return { success: false, message: data.message };
          }

          const user: User = {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.nombre,
            role: data.user.rol,
            companyId: data.empresa ? String(data.empresa.id) : undefined,
            companyName: data.empresa?.nombre,
            companyEstado: data.empresa?.estado,
            companyRecargo: data.empresa?.recargo,
            companyPorcentajeDevolucion: data.empresa?.porcentaje_devolucion,
            centroCostoId: data.centroCosto
              ? String(data.centroCosto.id)
              : undefined,
            centroCostoName: data.centroCosto?.nombre,
            centroCostoEstado: data.centroCosto?.estado,
          };

          set({
            token: data.token,
            user,
            isAuthenticated: true,
            requiresVerification: false,
            requiresPasswordUpdate: false,
            passwordUpdateReason: undefined,
            passwordUpdateUserId: undefined,
            validationError: undefined,
            pendingUserId: null,
            pendingUserEmail: null,
            verificationEmailSent: false,
          });

          return { success: true, message: "Verificación exitosa" };
        } catch {
          return { success: false, message: "Error verificando código" };
        }
      },

      resendOtp: async () => {
        const { pendingUserId } = get();
        if (!pendingUserId) {
          return { success: false, message: "No hay verificación pendiente" };
        }

        try {
          const res = await fetch("/api/auth/resend-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: pendingUserId }),
          });

          const data = await res.json();

          if (!res.ok) {
            return { success: false, message: data.message };
          }

          set({
            verificationEmailSent: true,
          });

          return { success: true, message: data.message || "Código reenviado" };
        } catch {
          return { success: false, message: "Error al reenviar código" };
        }
      },

      setPendingUserEmail: (email: string | null) => {
        set({ pendingUserEmail: email });
      },

      clearVerificationState: () => {
        set({
          requiresVerification: false,
          pendingUserId: null,
          pendingUserEmail: null,
          verificationEmailSent: false,
        });
      },

      clearPasswordUpdateState: () => {
        set({
          requiresPasswordUpdate: false,
          passwordUpdateReason: undefined,
          passwordUpdateUserId: undefined,
          validationError: undefined,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          requiresVerification: false,
          requiresPasswordUpdate: false,
          passwordUpdateReason: undefined,
          passwordUpdateUserId: undefined,
          validationError: undefined,
          pendingUserId: null,
          pendingUserEmail: null,
          verificationEmailSent: false,
        });
      },

      changeCompany: async (nuevaEmpresaId: string) => {
        const { token, user } = get();

        if (!token || !user) {
          return {
            success: false,
            message: "Usuario no autenticado",
          };
        }

        try {
          const res = await fetch("/api/users/cambiar-empresa", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              nueva_empresa_id: parseInt(nuevaEmpresaId),
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            return {
              success: false,
              message: data.message || "Error al cambiar empresa",
            };
          }

          // Verificar si recibimos un nuevo token
          if (!data.token) {
            return {
              success: false,
              message: "No se recibió un token válido del servidor",
            };
          }

          // Crear objeto de usuario actualizado
          const updatedUser: User = {
            ...user,
            companyId: nuevaEmpresaId,
            companyName: data.empresa?.nombre || user.companyName,
            companyEstado: data.empresa?.estado || user.companyEstado,
            companyRecargo: data.empresa?.recargo || user.companyRecargo,
            companyPorcentajeDevolucion:
              data.empresa?.porcentaje_devolucion ||
              user.companyPorcentajeDevolucion,
            centroCostoId: data.centroCosto
              ? String(data.centroCosto.id)
              : user.centroCostoId,
            centroCostoName: data.centroCosto?.nombre || user.centroCostoName,
            centroCostoEstado:
              data.centroCosto?.estado || user.centroCostoEstado,
          };

          set({
            token: data.token, // Nuevo token
            user: updatedUser,
          });

          return {
            success: true,
            message: data.message || "Empresa cambiada exitosamente",
            user: updatedUser,
            token: data.token,
            empresa: data.empresa,
            centroCosto: data.centroCosto,
          };
        } catch (err) {
          console.error("Error al cambiar empresa:", err);
          return {
            success: false,
            message: "Error al conectar con el servidor",
          };
        }
      },

      getToken: () => get().token,
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        _hasHydrated: state._hasHydrated,
        // No persistimos los estados temporales
      }),
    },
  ),
);

export const useTokenExpiration = (
  checkInterval = 30_000,
  logoutThresholdMs = 15 * 60 * 1000,
) => {
  const { token, logout, getToken } = useAuth();

  useEffect(() => {
    const decode = (t: string | null) => {
      if (!t) return null;
      try {
        return JSON.parse(atob(t.split(".")[1])) as { exp?: number };
      } catch {
        return null;
      }
    };

    const check = () => {
      const t = getToken();
      if (!t) return;

      const payload = decode(t);
      if (!payload?.exp) return logout();

      const msLeft = payload.exp * 1000 - Date.now();
      if (msLeft <= 0 || msLeft < logoutThresholdMs) logout();
    };

    check();
    const id = setInterval(check, checkInterval);
    return () => clearInterval(id);
  }, [token, logout, getToken, checkInterval, logoutThresholdMs]);
};

export const useAuthHydration = () => useAuth((state) => state._hasHydrated);

// Hook adicional para facilitar el uso
export const useVerificationState = () => {
  const requiresVerification = useAuth((state) => state.requiresVerification);
  const pendingUserId = useAuth((state) => state.pendingUserId);
  const pendingUserEmail = useAuth((state) => state.pendingUserEmail);
  const verificationEmailSent = useAuth((state) => state.verificationEmailSent);
  const clearVerificationState = useAuth(
    (state) => state.clearVerificationState,
  );
  const resendOtp = useAuth((state) => state.resendOtp);

  return {
    requiresVerification,
    pendingUserId,
    pendingUserEmail,
    verificationEmailSent,
    clearVerificationState,
    resendOtp,
  };
};

// Hook para proteger rutas que requieren verificación
export const useRequireAuth = (redirectTo = "/login") => {
  const { isAuthenticated, _hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, _hasHydrated, router, redirectTo]);

  return { isAuthenticated, hasHydrated: _hasHydrated };
};

export const usePasswordUpdateState = () => {
  const requiresPasswordUpdate = useAuth(
    (state) => state.requiresPasswordUpdate,
  );
  const passwordUpdateReason = useAuth((state) => state.passwordUpdateReason);
  const passwordUpdateUserId = useAuth((state) => state.passwordUpdateUserId);
  const validationError = useAuth((state) => state.validationError);
  const clearPasswordUpdateState = useAuth(
    (state) => state.clearPasswordUpdateState,
  );

  return {
    requiresPasswordUpdate,
    passwordUpdateReason,
    passwordUpdateUserId,
    validationError,
    clearPasswordUpdateState,
  };
};
