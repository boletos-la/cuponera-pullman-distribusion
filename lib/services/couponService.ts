import { apiClient } from '../apiClient';

export interface RedeemPayload {
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

  getDashboard: async () => {
    return await apiClient('/coupons/dashboard', {
      method: 'GET',
    });
  },
  
  sendRedeemOtp: async () => {
    return await apiClient('/coupons/send-otp', {
      method: 'POST',
    });
  },

  redeemCoupon: async (payload: RedeemPayload) => {
    return await apiClient('/coupons/redeem', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelCoupon: async (codigoCupon: string) => {
    return await apiClient('/coupons/cancel', {
      method: 'POST',
      body: JSON.stringify({ codigoCupon }),
    });
  }
};
