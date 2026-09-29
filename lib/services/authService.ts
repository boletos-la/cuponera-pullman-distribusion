import { apiClient } from '../apiClient';

export interface SendOtpPayload {
  rut: string;
  email: string;
  nombre?: string;
  telefono?: string;
  isRegister?: boolean;
}

export interface VerifyOtpPayload {
  rut: string;
  otpCode: string;
}

export const authService = {
  checkRut: async (rut: string) => {
    return await apiClient(`/auth/check-rut/${encodeURIComponent(rut)}`, {
      method: 'GET',
    });
  },

  sendOtp: async (payload: SendOtpPayload, isPurchase: boolean = false) => {
    const endpoint = isPurchase ? '/payments/send-otp-purchase' : '/auth/send-otp';
    return await apiClient(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    return await apiClient('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  register: async (payload: any) => {
    return await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: any) => {
    return await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
