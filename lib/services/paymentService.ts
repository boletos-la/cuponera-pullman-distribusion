import { apiClient } from '../apiClient';

export interface InitPaymentPayload {
  id_cuponera: number;
  rut: string;
  email: string;
  nombre: string;
}

export const paymentService = {
  initPayment: async (payload: InitPaymentPayload) => {
    return await apiClient('/payments/init', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
