"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Check, ChevronRight, Ticket, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepSearch } from "@/components/booking/step-search";
import { StepPassenger } from "@/components/booking/step-passenger";
import { StepConfirmation } from "@/components/booking/step-confirmation";
import { useReservationStore } from "@/lib/reservation-store";
import { useCuponStore } from "@/lib/cupon-store";
import type { BookingData } from "@/types/booking";
import { useCleanupStorage } from "@/hooks/useCleanupStorage";
import { useRouter } from "next/navigation";
import { StepCanje } from "./step-canje";
import { couponService } from "@/lib/services/couponService";
import { TicketLoader } from "@/components/ui/custom-loaders";

const steps = [
  { id: 1, name: "Búsqueda", icon: Bus },
  { id: 2, name: "Pasajero", icon: CheckCircle },
  { id: 3, name: "Canje", icon: Ticket },
  { id: 4, name: "Confirmación", icon: Check },
];

interface RedemptionFlowProps {
  initialCuponCode?: string;
  initialRut?: string;
  onFinishRedemption?: (rut: string) => void;
  onBack?: () => void;
}

export function RedemptionFlow({ initialCuponCode = '', initialRut = '', onFinishRedemption, onBack }: RedemptionFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    validationType: null,
    rut: initialRut,
    convenioCode: "",
    convenioName: "",
    convenioDiscount: 0,
    origin: "",
    destination: "",
    date: undefined,
    selectedSeats: [],
    passengerName: "",
    passengerRut: "",
    passengerEmail: "",
    tripPrice: 0,
    departureTime: "",
    arrivalTime: "",
    busType: "",
    paymentStatus: "pending",
    transactionId: "",
  });

  const { setCuponInfo, clearCuponInfo, cuponInfo } = useCuponStore();
  const clearAllReservations = useReservationStore((state) => state.clearAll);
  const { cleanupAll } = useCleanupStorage();

  useEffect(() => {
    // Validar el cupón inicial
    if (initialCuponCode && initialRut) {
      couponService.getDashboard(initialRut).then(res => {
        if (res.success && res.cupones) {
          // Buscar el cupon
          const cup = res.cupones.find((c: any) => c.codigo === initialCuponCode);
          if (cup) {
            setCuponInfo({
              codigo: cup.codigo,
              nombreCuponera: cup.nombreCuponera,
              tramosPermitidos: cup.tramosPermitidos,
              fechaVencimiento: cup.fechaVencimiento,
              rutUsuario: initialRut,
              emailUsuario: cup.emailCliente,
              nombreUsuario: cup.nombreCliente,
            });
          } else {
            console.error("No se encontró el cupón en las cuponeras del usuario.");
          }
        }
      }).catch(err => console.error(err)).finally(() => {
        setLoadingInitial(false);
      });
    } else {
      setLoadingInitial(false);
    }
    
    return () => {
      clearCuponInfo();
      clearAllReservations();
    };
  }, [initialCuponCode, initialRut]);

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleReleaseSeat = async () => {
    const departureBooking = useReservationStore.getState().getDepartureBooking();
    if (departureBooking?.pnrNumbers?.length && departureBooking?.selectedSeats?.length) {
      try {
        await couponService.releaseSeat(
          departureBooking.pnrNumbers[0],
          departureBooking.selectedSeats[0]
        );
      } catch (err) {
        console.error("Error releasing seat", err);
      }
    }
  };

  const prevStep = async () => {
    if (currentStep > 1) {
      await handleReleaseSeat();
      clearAllReservations();
      setCurrentStep(currentStep - 1);
    } else {
      await handleReleaseSeat();
      clearAllReservations();
      if (onBack) {
        onBack();
      } else {
        router.push('/');
      }
    }
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev: BookingData) => ({ ...prev, ...data }));
  };

  if (loadingInitial) {
    return (
      <TicketLoader message="Obteniendo datos de tu cuponera..." />
    );
  }

  if (!cuponInfo) {
    return (
      <div className="py-12 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-md text-center shadow-sm">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-lg font-bold mb-1.5 text-slate-900">Cupón Inválido</h2>
          <p className="text-xs text-slate-600 mb-5">No se pudo validar el cupón proporcionado. Por favor, vuelve al dashboard e intenta nuevamente.</p>
          <Button
            className="bg-[#F05A24] hover:bg-[#D94B18] text-white font-semibold text-xs px-5 py-2 rounded-xl"
            onClick={() => onBack ? onBack() : router.push('/')}
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header del flujo de canje */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 sticky top-2 z-30 backdrop-blur-md bg-white/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Lado izquierdo: Botón volver + Información del cupón */}
          <div className="flex items-center gap-3.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 sm:px-3 sm:py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
                title="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F05A24] shrink-0">
              <Ticket className="w-5 h-5" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Canje de Pasaje
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-50 text-[#D94B18] border border-orange-200/80">
                  {cuponInfo.codigo}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                {cuponInfo.nombreCuponera || 'Cuponera Digital Pullman Bus'}
              </p>
            </div>
          </div>

          {/* Lado derecho: Pasos del flujo */}
          <div className="flex items-center overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
              {steps.map((step, idx) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.id}>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#F05A24] text-white shadow-md shadow-orange-500/20"
                          : isCompleted
                          ? "bg-orange-50 text-[#F05A24] border border-orange-100"
                          : "text-slate-400 bg-slate-50 border border-slate-100"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-full ${
                          isActive
                            ? "bg-white/25 text-white"
                            : isCompleted
                            ? "bg-[#F05A24]/10 text-[#F05A24]"
                            : "bg-slate-200/70 text-slate-400"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <span>{step.name}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-0.5 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 1 && (
              <StepSearch
                bookingData={bookingData}
                updateBookingData={updateBookingData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 2 && (
              <StepPassenger
                bookingData={bookingData}
                updateBookingData={updateBookingData}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {currentStep === 3 && (
              <StepCanje
                bookingData={bookingData}
                updateBookingData={updateBookingData}
                onNext={nextStep}
                onBack={prevStep}
                cuponInfo={cuponInfo}
              />
            )}
            {currentStep === 4 && (
              <StepConfirmation
                bookingData={bookingData}
                onFinish={() => {
                  if (onFinishRedemption) {
                    onFinishRedemption(bookingData.passengerRut);
                  } else {
                    router.push('/');
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
