"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  Bus,
  Users,
  ArrowRight,
  X,
  Trash2,
  ArrowLeft,
  Tag,
  Percent,
} from "lucide-react";
import { useCuponStore } from "@/lib/cupon-store";
import { SeatSelector } from "@/components/seat-selector";
import type { ServiceDetail, Seat } from "@/types/service-detail";
import { useTravel } from "@/components/context/travel-context";
import { getApiUrl } from "@/lib/apiClient";
import { couponService } from "@/lib/services/couponService";
import { SeatMapLoader, EmissionLoader } from "@/components/ui/custom-loaders";
import {
  useReservationStore,
  type CompletedBooking,
  type BookingSeat,
} from "@/lib/reservation-store";

interface ServiceDetailDialogProps {
  serviceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalOrigen: string | null;
  terminalDestino: string | null;
  tripType?: "departure" | "return";
  onNext?: () => void;
  isRoundTrip?: boolean;
  originName: string;
  destinationName: string;
}

interface PassengerData {
  id: string;
  seat: string;
  passenger: any | null;
  completed: boolean;
}

export function ServiceDetailDialog({
  serviceId,
  open,
  onOpenChange,
  terminalOrigen,
  terminalDestino,
  tripType = "departure",
  onNext,
  isRoundTrip = false,
  originName,
  destinationName,
}: ServiceDetailDialogProps) {
  const { addCompletedBooking, clearOldBookings, getDepartureBooking } =
    useReservationStore();
  const { cuponInfo } = useCuponStore();

  const [serviceDetail, setServiceDetail] = useState<ServiceDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingSeat[]>([]);
  const { origin, destination } = useTravel();
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [disponibilidadVerificada, setDisponibilidadVerificada] =
    useState<boolean>(false);
  const [passengersData, setPassengersData] = useState<PassengerData[]>([]);
  const bookingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estados para guardar y usar pasajeros de la ida
  const [savedPassengers, setSavedPassengers] = useState<any[]>([]);
  const [usingSavedPassengers, setUsingSavedPassengers] = useState(false);

  // Ref para trackear si ya se limpiaron las reservas antiguas
  const oldBookingsCleaned = useRef(false);

  // Estados para las ciudades a mostrar
  const [displayOrigin, setDisplayOrigin] = useState<string>(originName);
  const [displayDestination, setDisplayDestination] =
    useState<string>(destinationName);

  const swalConfig = {
    customClass: {
      container: "swal-container",
      popup:
        "swal-popup bg-background border-2 border-border rounded-lg shadow-xl",
      header: "swal-header",
      title: "swal-title text-foreground font-bold text-xl",
      closeButton: "swal-close",
      icon: "swal-icon",
      image: "swal-image",
      content: "swal-content text-foreground",
      htmlContainer: "swal-html-container text-foreground",
      input: "swal-input",
      inputLabel: "swal-input-label",
      validationMessage: "swal-validation-message",
      actions: "swal-actions gap-3",
      confirmButton:
        "swal-confirm-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-destructive/80 text-destructive-foreground hover:bg-destructive h-10 py-2 px-4 cursor-pointer",
      cancelButton:
        "swal-cancel-btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 cursor-pointer",
      footer: "swal-footer",
    },
    buttonsStyling: false,
    reverseButtons: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: true,
    didOpen: () => {
      const container = document.querySelector(
        ".swal-container",
      ) as HTMLElement;
      const popup = document.querySelector(".swal-popup") as HTMLElement;
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (container) {
        container.style.zIndex = "999999";
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
      }
      if (popup) {
        popup.style.zIndex = "1000000";
      }
      if (modal) {
        modal.style.zIndex = "1";
      }
    },
    willClose: () => {
      const modal = document.querySelector('[role="dialog"]') as HTMLElement;
      if (modal) {
        modal.style.zIndex = "";
      }
    },
  };

  const MAX_SEATS = 1; // Para canje de cupones, 1 asiento a la vez

  const roundPrice = (price: number): number => {
    return Math.round(price);
  };

  const extractPrice = (costString: string): number => {
    if (!costString) return 0;
    const priceMatch = costString.match(/(\d+\.?\d*)/);
    if (!priceMatch) return 0;
    return parseFloat(priceMatch[1]);
  };

  const getDisplaySeatPrice = (): number => {
    if (!serviceDetail) return 0;
    if (selectedSeats.length > 0) {
      const availableSeats = parseSeats();
      const lastSeatNumber = selectedSeats[selectedSeats.length - 1];
      const seat = availableSeats.find((s) => s.number === lastSeatNumber);
      if (seat) {
        return seat.basePrice;
      }
    }
    return extractPrice(serviceDetail.cost);
  };

  const getDiscountedPrice = (basePrice: number): number => {
    return 0; // Para canje, el precio final a pagar es 0
  };

  const getTotalPrice = (): number => {
    const availableSeats = parseSeats();
    return selectedSeats.reduce((total, seatNumber) => {
      const seat = availableSeats.find((s) => s.number === seatNumber);
      if (!seat) return total;

      const seatBasePrice = seat.basePrice;
      const seatDiscountedPrice = getDiscountedPrice(seatBasePrice);
      return total + seatDiscountedPrice;
    }, 0);
  };

  const getDiscountText = (basePrice: number): string => {
    return "Canje de Cupón (100% DCTO)";
  };

  const getMainBusType = (busType: string | null | undefined): string => {
    if (!busType) return "";
    const parts = busType.split(",").map((p) => p.trim());
    const ignore = ["2+2", "2+1", "AC", "Video", "WiFi", "Baño"];
    const main = parts.find((p) => !ignore.includes(p));
    return main || parts[0];
  };

  useEffect(() => {
    if (open && serviceId) {
      loadServiceDetail();
    } else {
      setServiceDetail(null);
      setSelectedSeats([]);
      setError(null);
      setDisponibilidadVerificada(false);
      setPassengersData([]);
      setBookingData([]);
      setBookingError(null);
      setSavedPassengers([]);
      setUsingSavedPassengers(false);
    }
  }, [open, serviceId]);

  // Cargar pasajeros guardados cuando se abre el modal de vuelta
  useEffect(() => {
    if (open && tripType === "return") {
      // Obtener las reservas de ida del store de Zustand
      const departureBooking = getDepartureBooking();

      if (
        departureBooking?.passengers &&
        departureBooking.passengers.length > 0
      ) {
        setSavedPassengers(departureBooking.passengers);
      } else {
        setSavedPassengers([]);
      }
    } else {
      setSavedPassengers([]);
    }
  }, [open, tripType, getDepartureBooking]);

  // Validación de asientos vs pasajeros guardados
  useEffect(() => {
    if (
      tripType === "return" &&
      Array.isArray(savedPassengers) &&
      savedPassengers.length > 0 &&
      selectedSeats.length > savedPassengers.length
    ) {
      setBookingError(
        `Para el viaje de vuelta, solo puedes seleccionar hasta ${savedPassengers.length} asiento(s) 
        (el mismo número de pasajeros del viaje de ida)`,
      );

      // Remover asientos extras
      const validSeats = selectedSeats.slice(0, savedPassengers.length);
      setSelectedSeats(validSeats);
      return;
    }
    setBookingError(null); // Limpiar error si no hay problema
  }, [tripType, savedPassengers, selectedSeats]);

  // Función para crear/actualizar passengersData
  const createPassengersData = useCallback(() => {
    if (selectedSeats.length === 0) {
      setPassengersData([]);
      return;
    }

    const newPassengersData: PassengerData[] = selectedSeats.map(
      (seat, index) => {
        // Buscar si ya existe este passenger para este asiento
        const existingPassenger = passengersData.find((p) => p.seat === seat);

        if (existingPassenger) {
          return existingPassenger;
        }

        // PARA LA VUELTA: Intentar asignar pasajeros guardados en orden
        if (
          tripType === "return" &&
          Array.isArray(savedPassengers) &&
          savedPassengers.length > 0
        ) {
          const savedPassenger = savedPassengers[index] || null;
          return {
            id: `passenger-${Date.now()}-${Math.random()}`,
            seat,
            passenger: savedPassenger || null,
            completed: !!savedPassenger,
          };
        }

        // Para ida o si no hay pasajeros guardados
        return {
          id: `passenger-${Date.now()}-${Math.random()}`,
          seat,
          passenger: null,
          completed: false,
        };
      },
    );

    return newPassengersData;
  }, [selectedSeats, tripType, savedPassengers, passengersData]);

  // Actualizar passengersData cuando cambian los asientos seleccionados
  useEffect(() => {
    const newPassengersData = createPassengersData();

    if (newPassengersData) {
      // Solo actualizar si hay cambios reales
      const hasChanged =
        newPassengersData.length !== passengersData.length ||
        !newPassengersData.every((newPassenger, index) => {
          const oldPassenger = passengersData[index];
          if (!oldPassenger) return false;
          return (
            newPassenger.seat === oldPassenger.seat &&
            newPassenger.completed === oldPassenger.completed &&
            newPassenger.passenger?.id === oldPassenger.passenger?.id
          );
        });

      if (hasChanged) {
        setPassengersData(newPassengersData);
      }
    }
  }, [selectedSeats, tripType, savedPassengers]);

  const fetchServiceDetailSilent = async () => {
    const res = await fetch(`${getApiUrl()}/gds/service-detail/${serviceId}`);

    if (!res.ok) {
      throw new Error(`Error: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.service;
  };

  const loadServiceDetail = async () => {
    setLoadingDetail(true);
    setError(null);
    setDisponibilidadVerificada(false);

    try {
      const service = await fetchServiceDetailSilent();

      setServiceDetail(service);
      // Establecer disponibilidad como verificada para permitir continuar
      setDisponibilidadVerificada(true);

      return service;
    } catch (err) {
      console.error("Error loading service detail:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar detalles del servicio",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const parseSeats = (service?: ServiceDetail): Seat[] => {
    const source = service || serviceDetail;

    if (!source?.bus_layout?.available) return [];

    const seats: Seat[] = [];
    const availableSeats = source.bus_layout.available.split(",");

    availableSeats.forEach((seatInfo) => {
      const [seatNumber, priceStr] = seatInfo.split("|");

      if (seatNumber && priceStr) {
        const base = parseFloat(priceStr.trim());

        seats.push({
          number: seatNumber.trim(),
          price: base,
          basePrice: base,
          available: true,
          row: Math.ceil(parseInt(seatNumber) / 4),
          position: (parseInt(seatNumber) - 1) % 4,
        });
      }
    });

    return seats.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  };

  const getOccupiedSeats = (): string[] => {
    if (!serviceDetail) return [];

    const totalSeats = serviceDetail.bus_layout.total_seats;
    const availableSeats = parseSeats().map((seat) => seat.number);
    const allSeats = Array.from({ length: totalSeats }, (_, i) =>
      (i + 1).toString(),
    );

    return allSeats.filter((seat) => !availableSeats.includes(seat));
  };

  const markSeatsAsUnavailable = (seatNumbers: string[]) => {
    if (!serviceDetail) return;

    const seatMap = new Map();
    serviceDetail.bus_layout.available
      .split(",")
      .filter((s) => s.trim())
      .forEach((seatInfo) => {
        const [seatNumber] = seatInfo.split("|");
        if (seatNumber) {
          seatMap.set(seatNumber.trim(), seatInfo);
        }
      });

    seatNumbers.forEach((seat) => {
      seatMap.delete(seat);
    });

    const available = Array.from(seatMap.values()).join(",");

    setServiceDetail({
      ...serviceDetail,
      bus_layout: {
        ...serviceDetail.bus_layout,
        available,
      },
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const swalContainer = document.querySelector(".swal2-container");
      if (swalContainer && swalContainer.hasAttribute("aria-modal")) {
        if (e.key === "Enter") {
          const confirmBtn = document.querySelector(".swal2-confirm");
          if (confirmBtn) {
            (confirmBtn as HTMLElement).click();
          }
        } else if (e.key === "Escape") {
          const cancelBtn =
            document.querySelector(".swal2-cancel") ||
            document.querySelector(".swal2-close");
          if (cancelBtn) {
            (cancelBtn as HTMLElement).click();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSeatSelection = (seats: string[]) => {
    if (!disponibilidadVerificada) {
      return;
    }
    setSelectedSeats(seats);
  };

  const handleRemoveSeat = (seatToRemove: string) => {
    setSelectedSeats(selectedSeats.filter((seat) => seat !== seatToRemove));
  };

  const handlePassengerSelected = (passengerId: string, passenger: any) => {
    setPassengersData((prev) =>
      prev.map((p) =>
        p.id === passengerId ? { ...p, passenger, completed: !!passenger } : p,
      ),
    );
  };

  const handlePassengerCreated = (passengerId: string, passenger: any) => {
    setPassengersData((prev) =>
      prev.map((p) =>
        p.id === passengerId ? { ...p, passenger, completed: !!passenger } : p,
      ),
    );
  };

  const allPassengersCompleted = (): boolean => {
    // Si estamos usando pasajeros guardados y todos están completos
    if (usingSavedPassengers) {
      return passengersData.every((p) => p.completed && p.passenger);
    }

    // Validación normal
    return (
      passengersData.length > 0 && passengersData.every((p) => p.completed)
    );
  };

  const handleUseSavedPassengers = () => {
    if (!Array.isArray(savedPassengers) || savedPassengers.length === 0) return;

    // Asignar pasajeros guardados a los asientos seleccionados
    const updatedPassengersData = passengersData.map((pData, index) => {
      const savedPassenger = savedPassengers[index] || null;
      if (savedPassenger) {
        return {
          ...pData,
          passenger: savedPassenger,
          completed: true,
        };
      }
      return pData;
    });

    setPassengersData(updatedPassengersData);
    setUsingSavedPassengers(true);

    // Mostrar mensaje de éxito
    setBookingError(null);
  };

  const handleBooking = async () => {
    if (!selectedSeats.length || !serviceDetail) {
      setBookingError("Debe seleccionar al menos un asiento");
      return;
    }

    setBookingError(null);
    setLoading(true);

    let bookings: BookingSeat[] = [];

    try {
      // 1. Refetch antes de reservar
      const freshService = await fetchServiceDetailSilent();

      if (!freshService) {
        setBookingError(
          "No se pudo validar la disponibilidad. Intenta nuevamente.",
        );
        setLoading(false);
        return;
      }

      // 2. Validar asientos seleccionados vs backend
      const freshAvailableSeats = freshService.bus_layout.available
        .split(",")
        .map((s: string) => s.split("|")[0].trim());

      const invalidSeats = selectedSeats.filter(
        (seat) => !freshAvailableSeats.includes(seat),
      );

      if (invalidSeats.length > 0) {
        setSelectedSeats((prev) =>
          prev.filter((seat) => !invalidSeats.includes(seat)),
        );

        setPassengersData((prev) =>
          prev.filter((p) => !invalidSeats.includes(p.seat)),
        );

        setBookingError(
          `Los siguientes asientos ya no están disponibles: ${invalidSeats.join(", ")}`,
        );

        setLoading(false);
        return;
      }

      const boardingPoint = freshService.boarding_stages?.split("|")[0];
      const dropoffPoint = freshService.dropoff_stages?.split("|")[0];
      const availableSeats = parseSeats(freshService);
      bookings = [];

      // Solo reservar cada asiento (sin confirmar)
      for (const passengerData of passengersData) {
        const seatObj = availableSeats.find(
          (s) => s.number === passengerData.seat,
        );
        const seatBasePrice = seatObj?.basePrice || 0;
        const seatFinalPrice = getDiscountedPrice(seatBasePrice);

        const bookResponse = await fetch(`${getApiUrl()}/gds/reserve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: serviceId.toString(),
            seatNumber: passengerData.seat,
            price: seatBasePrice, // Enviar precio base a la API
            originId: freshService.origin_id,
            destinationId: freshService.destination_id,
            travelDate: freshService.travel_date,
            busType: freshService.bus_type,
            routeId: freshService.route_id,
            availableSeats: freshService.available_seats,
            cost: freshService.cost,
            boardingAt: boardingPoint,
            dropoffAt: dropoffPoint,
            passengerName: passengerData.passenger?.name || cuponInfo?.nombreCliente || "Titular de Cuponera",
            passengerEmail: passengerData.passenger?.email || cuponInfo?.emailCliente || "correo@reservas.cl",
            passengerRut: passengerData.passenger?.rut || cuponInfo?.rutUsuario || "11111111-1",
          }),
        });

        const bookData = await bookResponse.json();

        if (!bookResponse.ok || !bookData.success) {
          console.error("Error booking seat:", passengerData.seat, bookData);

          const errorType = bookData?.type;
          const errorMsg = bookData?.error || "";
          const detailMsg = bookData?.details?.response?.message || "";

          const isSeatUnavailable =
            errorType === "SEAT_UNAVAILABLE" ||
            errorMsg.includes("no está disponible");

          const isFareMismatch = detailMsg.includes("Fare mismatched");
          const isSeatNotFound = detailMsg.includes("Seat Number not Found");

          // 1. Asiento realmente ocupado
          if (isSeatUnavailable && !isFareMismatch && !isSeatNotFound) {
            markSeatsAsUnavailable([passengerData.seat]);

            setSelectedSeats((prev) =>
              prev.filter((seat) => seat !== passengerData.seat),
            );

            setPassengersData((prev) =>
              prev.filter((p) => p.seat !== passengerData.seat),
            );

            setBookingError(
              `El asiento ${passengerData.seat} ya no está disponible. Fue removido de tu selección.`,
            );

            if (passengersData.length > 1) {
              continue;
            } else {
              setLoading(false);
              return;
            }
          }

          // 2. Precio no coincide (MUY IMPORTANTE)
          if (isFareMismatch) {
            setBookingError(
              `El precio del asiento ${passengerData.seat} cambió. Refresca los asientos e intenta nuevamente.`,
            );

            setLoading(false);
            return;
          }

          // 3. Asiento inválido o layout cambió
          if (isSeatNotFound) {
            setBookingError(
              `El asiento ${passengerData.seat} ya no es válido. Actualiza la disponibilidad e intenta nuevamente.`,
            );

            markSeatsAsUnavailable([passengerData.seat]);

            setSelectedSeats((prev) =>
              prev.filter((seat) => seat !== passengerData.seat),
            );

            setPassengersData((prev) =>
              prev.filter((p) => p.seat !== passengerData.seat),
            );

            setLoading(false);
            return;
          }

          // 4. Error genérico (fallback)
          throw new Error(
            `Error al reservar el asiento ${passengerData.seat}: ${
              errorMsg || detailMsg || "Error desconocido"
            }`,
          );
        }

        // Solo guardamos información de reserva (sin confirmación)
        bookings.push({
          seat: passengerData.seat,
          pnrNumber: bookData.pnrNumber,
          pnrNumberTicket: bookData.operatorPnr,
          passenger: passengerData.passenger,
          bookingTime: new Date().toISOString(),
        });
      }

      setBookingError(null);

      const getRealTotalPrice = (): number => {
        const availableSeats = parseSeats(freshService);

        return selectedSeats.reduce((total, seatNumber) => {
          const seat = availableSeats.find((s) => s.number === seatNumber);
          if (!seat) return total;

          return total + seat.basePrice;
        }, 0);
      };

      // antiguo
      // const totalWithDiscount = getTotalPrice();

      // Calcular total con descuento usando los precios de freshService,
      // para que tarifa_base y monto_pagado siempre sean consistentes
      // con el precio vigente en el momento de ejecutar /reserve.
      const getDiscountedTotalFromFresh = (): number => {
        const availableSeats = parseSeats(freshService);
        return selectedSeats.reduce((total, seatNumber) => {
          const seat = availableSeats.find((s) => s.number === seatNumber);
          if (!seat) return total;
          return total + getDiscountedPrice(seat.basePrice);
        }, 0);
      };

      const realTotal = getRealTotalPrice();
      const totalWithDiscount = getDiscountedTotalFromFresh();

      // Crear un objeto simple para la reserva
      const currentBooking: CompletedBooking = {
        tripType,
        origin: displayOrigin,
        destination: displayDestination,
        date: freshService.travel_date,
        dep_time: freshService.dep_time,
        arr_time: freshService.arr_time,
        travel_name: freshService.travels_name,
        travel_id: freshService.travel_id || freshService.id || '0',
        selectedSeats: selectedSeats,
        seats: selectedSeats,
        passengers: passengersData.map((p) => p.passenger),
        totalPrice: totalWithDiscount,
        realPrice: realTotal,
        pnrNumbers: bookings.map((b) => b.pnrNumber),
        pnrNumbersTicket: bookings.map((b) => b.pnrNumberTicket),
        bookingTime: new Date().toISOString(),
        terminalOrigen,
        terminalDestino,
        bus_type: freshService.bus_type,
        bookingData: bookings,
      };

      // IMPORTANTE: Limpiar reservas antiguas solo la primera vez que se reserva la IDA
      if (tripType === "departure" && !oldBookingsCleaned.current) {
        clearOldBookings();
        oldBookingsCleaned.current = true;
      }

      addCompletedBooking(currentBooking);

      // Manejar diferente para ida y vuelta
      if (tripType === "departure" && isRoundTrip) {
        // 1. Cerrar el modal de ida
        setTimeout(() => {
          onOpenChange(false);
        }, 500);

        // 2. Disparar evento para buscar la vuelta
        window.dispatchEvent(new CustomEvent("departureBooked"));

        // 3. NO llamar a onNext() - El usuario debe completar la vuelta primero
      } else if (tripType === "return" && isRoundTrip) {
        // Cuando se completa la VUELTA, ahora sí ir al pago
        setTimeout(() => {
          onOpenChange(false); // Cerrar el modal
          if (onNext) onNext(); // Ir al paso de pago
        }, 500);
      } else {
        // Viaje solo de ida: ir directo al pago
        setTimeout(() => {
          onOpenChange(false); // Cerrar el modal
          if (onNext) onNext(); // Ir al paso de pago
        }, 500);
      }

      // Evento para nueva reserva
      window.dispatchEvent(new Event("newBooking"));

      setBookingData(bookings);
      markSeatsAsUnavailable(selectedSeats);

      // No cerrar automáticamente
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setBookingError(
        err instanceof Error
          ? err.message
          : "Error inesperado al procesar las reservas",
      );
      
      // Rollback any seats successfully locked before the error
      for (const b of bookings) {
        if (b.pnrNumber && b.seat) {
          try {
            await couponService.releaseSeat(b.pnrNumber, b.seat);
          } catch (releaseErr) {
            console.error("Error releasing seat during rollback:", releaseErr);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleModalClose = (state: boolean) => {
    if (!state && (loading || loadingDetail)) {
      return;
    }
    onOpenChange(state);
  };

  const availableSeats = parseSeats();
  const occupiedSeats = getOccupiedSeats();

  const formatTravelDate = (date: string) => {
    try {
      const [year, month, day] = date.split("-").map(Number);

      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];

      const monthName = months[month - 1];

      return `${day} de ${monthName} de ${year}`;
    } catch (error) {
      console.error("Error formateando fecha de viaje:", error);
      return date;
    }
  };

  const canConfirm =
    disponibilidadVerificada &&
    selectedSeats.length > 0 &&
    allPassengersCompleted();

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent
        className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto z-51 p-4 sm:p-6"
        onEscapeKeyDown={(e) => {
          if (loading || loadingDetail) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        {loading && <EmissionLoader message="Confirmando tus asientos y emitiendo tu boleto electrónico..." />}
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            Detalles del Servicio
            <Badge variant="outline">
              {tripType === "departure" ? "Viaje de Ida" : "Viaje de Vuelta"}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {tripType === "departure"
              ? `Paso 1 de 2: Reserva tu viaje de ida`
              : `Paso 2 de 2: Reserva tu viaje de vuelta`}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <SeatMapLoader message="Trazando el plano del bus y validando disponibilidad..." />
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : serviceDetail ? (
          <>
            <div className="space-y-6">
              {/* Información del servicio */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">
                      {serviceDetail.travels_name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        availableSeats.length > 0 ? "default" : "destructive"
                      }
                      className="text-xs sm:text-sm"
                    >
                      {availableSeats.length} asientos disponibles
                    </Badge>
                    {selectedSeats.length > 0 && (
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        {selectedSeats.length} seleccionados
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium flex items-center gap-1 text-sm sm:text-base truncate">
                    {displayOrigin}
                    <ArrowRight className="h-3 w-3 opacity-60 shrink-0" />
                    {displayDestination}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatTravelDate(serviceDetail.travel_date)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Salida: {serviceDetail.dep_time}</span>
                    </div>
                    {terminalOrigen && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {terminalOrigen}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Llegada: {serviceDetail.arr_time}</span>
                    </div>
                    {terminalDestino && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {terminalDestino}
                      </p>
                    )}
                  </div>
                </div>

                {serviceDetail.bus_type && (
                  <div className="text-sm">
                    <strong>Tipo de bus:</strong>{" "}
                    {getMainBusType(serviceDetail.bus_type)}
                  </div>
                )}

                <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Precio por asiento:
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-primary">
                      <DollarSign className="h-4 w-4" />
                      {getDiscountedPrice(
                        getDisplaySeatPrice(),
                      ).toLocaleString("es-CL")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de asientos */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="font-semibold text-lg">
                    Selecciona tus Asientos (máximo {MAX_SEATS})
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {availableSeats.length} de{" "}
                      {serviceDetail.bus_layout.total_seats} disponibles
                    </span>
                  </div>
                </div>

                <SeatSelector
                  totalSeats={serviceDetail.bus_layout.total_seats}
                  occupiedSeats={occupiedSeats}
                  onSeatSelect={handleSeatSelection}
                  selectedSeats={selectedSeats}
                  seats={availableSeats.map((s) => ({
                    ...s,
                    price: getDiscountedPrice(s.basePrice),
                  }))}
                  coachDetails={serviceDetail.bus_layout.coach_details}
                  floor={serviceDetail.bus_layout.floor}
                  disabled={!disponibilidadVerificada}
                  maxSeats={MAX_SEATS}
                />

                {selectedSeats.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-white text-xs">
                            {selectedSeats.length} seleccionados
                          </Badge>
                          <span className="text-sm font-medium text-blue-800">
                            $ {getTotalPrice().toLocaleString("es-CL")}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-600 truncate">
                          Asientos: {selectedSeats.join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSeats([])}
                        className="h-8 px-2 text-red-600 border border-red-300 hover:text-red-800 hover:bg-red-50 shrink-0 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1 inline" />
                        <span className="hidden sm:inline">
                          Limpiar selección
                        </span>
                        <span className="sm:hidden">Limpiar</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>


            </div>

            {bookingError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex justify-center items-center">
                  {bookingError}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button
                onClick={handleBooking}
                disabled={selectedSeats.length === 0 || loading}
                className={`w-full sm:w-auto order-1 sm:order-2 ${
                  selectedSeats.length === 0
                    ? "opacity-50 cursor-not-allowed bg-primary/50 text-white"
                    : "bg-primary hover:bg-primary/90 text-white"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reservando asiento(s)...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {tripType === "return" && isRoundTrip
                      ? "Reservar asiento(s) de vuelta"
                      : "Reservar asiento(s)"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
