import { apiClient } from '../apiClient';

export interface SendOtpPayload {
  rut: string;
  email: string;
  nombre?: string;
  telefono?: string;
}

export interface VerifyOtpPayload {
  rut: string;
  otpCode: string;
}

export const authService = {
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
};
