"use client";

import { useCuponStore } from "@/lib/cupon-store";
import { useReservationStore } from "@/lib/reservation-store";

export const useCleanupStorage = () => {
  const clearAllReservations = useReservationStore((state) => state.clearAll);
  const clearCuponInfo = useCuponStore((state) => state.clearCuponInfo);

  const cleanupAll = () => {
    console.log("Limpiando todos los stores...");

    // Limpiar Zustand stores
    clearAllReservations();
    clearCuponInfo();

    // Limpiar localStorage específico
    localStorage.removeItem("pending_transaction");
    localStorage.removeItem("payment_retry");
    localStorage.removeItem("last_payment_data");
    localStorage.removeItem("reservation-storage");
    localStorage.removeItem("cupon-storage");
    localStorage.removeItem("kupos_confirmation_errors");

    // Limpiar sessionStorage si lo usas
    sessionStorage.clear();

    console.log("Limpieza completada");
  };

  const cleanupPaymentData = () => {
    console.log("Limpiando datos de pago...");
    localStorage.removeItem("pending_transaction");
    localStorage.removeItem("payment_retry");
    localStorage.removeItem("last_payment_data");
  };

  const cleanupReservationsOnly = () => {
    console.log("Limpiando solo reservas...");
    clearAllReservations();
    localStorage.removeItem("reservation-storage");
    localStorage.removeItem("kupos_confirmation_errors");
  };

  return {
    cleanupAll,
    cleanupPaymentData,
    cleanupReservationsOnly,
  };
};
