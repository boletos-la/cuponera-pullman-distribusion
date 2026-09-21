import { apiClient } from '../apiClient';

export interface RedeemPayload {
  rut: string;
  idUsuarioCuponera: number;
  idRuta: number;
  otpCode?: string;
  pnrNumber: string;
  operatorPnr: string;
  travelId: string;
  origin: string;
  destination: string;
  seatNumber: string;
  travelDate: string;
  fare: number;
  kuposEnv?: string;
}

export const couponService = {
  getCatalog: async () => {
    return await apiClient('/coupons/catalog', {
      method: 'GET',
    });
  },

  getDashboard: async (rut: string) => {
    return await apiClient(`/coupons/dashboard?rut=${rut}`, {
      method: 'GET',
    });
  },
  
  sendRedeemOtp: async (rut: string) => {
    return await apiClient('/coupons/send-otp', {
      method: 'POST',
      body: JSON.stringify({ rut }),
    });
  },

  redeemCoupon: async (payload: RedeemPayload) => {
    return await apiClient('/coupons/redeem', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelCoupon: async (codigoCupon: string, rut: string, otpCode: string) => {
    return await apiClient('/coupons/cancel', {
      method: 'POST',
      body: JSON.stringify({ codigoCupon, rut, otpCode }),
    });
  }
};
