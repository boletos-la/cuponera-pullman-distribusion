import { create } from 'zustand';

export interface CuponInfo {
  codigo: string;
  nombreCuponera: string;
  tramosPermitidos: string[];
  fechaVencimiento: string;
  rutUsuario: string;
  emailUsuario?: string;
  nombreUsuario?: string;
  nombreCliente?: string;
  emailCliente?: string;
}

interface CuponStore {
  cuponInfo: CuponInfo | null;
  isValidated: boolean;
  setCuponInfo: (info: CuponInfo) => void;
  clearCuponInfo: () => void;
}

export const useCuponStore = create<CuponStore>((set) => ({
  cuponInfo: null,
  isValidated: false,
  setCuponInfo: (info) => set({ cuponInfo: info, isValidated: true }),
  clearCuponInfo: () => set({ cuponInfo: null, isValidated: false }),
}));
