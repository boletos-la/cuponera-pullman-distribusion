import { apiClient } from '../apiClient';

export interface SendOtpPayload {
  rut: string;
  email: string;
}

export interface VerifyOtpPayload {
  rut: string;
  otpCode: string;
}

export const authService = {
  sendOtp: async (payload: SendOtpPayload) => {
    return await apiClient('/auth/send-otp', {
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
