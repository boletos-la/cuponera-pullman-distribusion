import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BookingPassenger {
  id: string;
  nombre: string;
  rut: string;
  correo: string;
  telefono?: string;
}

export interface BookingSeat {
  seat: string;
  pnrNumber: string;
  pnrNumberTicket: string;
  passenger: BookingPassenger;
  bookingTime: string;
}

export interface CompletedBooking {
  tripType: "departure" | "return";
  origin: string;
  destination: string;
  date: string;
  dep_time: string;
  arr_time: string;
  travel_name: string;
  selectedSeats: string[];
  seats: string[];
  passengers: BookingPassenger[];
  totalPrice: number;
  realPrice: number;
  pnrNumbers: string[];
  pnrNumbersTicket: string[];
  bookingTime: string;
  terminalOrigen: string | null;
  terminalDestino: string | null;
  bookingData: BookingSeat[];
}

interface ReservationStore {
  // Estado
  completedBookings: CompletedBooking[];
  savedPassengers: BookingPassenger[];

  // Acciones
  addCompletedBooking: (booking: CompletedBooking) => void;
  clearCompletedBookings: () => void;
  clearOldBookings: () => void;
  getDepartureBooking: () => CompletedBooking | undefined;
  getSavedPassengers: () => BookingPassenger[];
  setSavedPassengers: (passengers: BookingPassenger[]) => void;

  // Utilitarios
  hasDepartureBooking: () => boolean;
  hasReturnBooking: () => boolean; // Por si acaso la mantienes
  getBookingCount: () => number;
  clearAll: () => void;
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      completedBookings: [],
      savedPassengers: [],

      // Acciones
      addCompletedBooking: (booking) => {
        set((state) => {
          const filteredBookings = state.completedBookings.filter(
            (b) => b.tripType !== booking.tripType,
          );

          return {
            completedBookings: [...filteredBookings, booking],
          };
        });
      },

      clearCompletedBookings: () => {
        set({ completedBookings: [] });
      },

      clearOldBookings: () => {
        const state = get();
        if (state.completedBookings.length > 0) {
          set({ completedBookings: [] });
        }
      },

      getDepartureBooking: () => {
        return get().completedBookings.find(
          (booking) => booking.tripType === "departure",
        );
      },

      getSavedPassengers: () => {
        const departureBooking = get().getDepartureBooking();
        return departureBooking?.passengers || [];
      },

      setSavedPassengers: (passengers) => {
        set({ savedPassengers: passengers });
      },

      // Utilitarios
      hasDepartureBooking: () => {
        return get().completedBookings.some(
          (booking) => booking.tripType === "departure",
        );
      },

      hasReturnBooking: () => {
        return get().completedBookings.some(
          (booking) => booking.tripType === "return",
        );
      },

      getBookingCount: () => {
        return get().completedBookings.length;
      },

      clearAll: () => {
        set({
          completedBookings: [],
          savedPassengers: [],
        });
      },
    }),
    {
      name: "reservation-storage",
    },
  ),
);
