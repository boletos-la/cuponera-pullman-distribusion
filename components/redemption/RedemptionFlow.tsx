"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Check, ChevronRight, Ticket, CheckCircle } from "lucide-react";
import { StepSearch } from "@/components/booking/step-search";
import { StepPassenger } from "@/components/booking/step-passenger";
import { StepConfirmation } from "@/components/booking/step-confirmation"; // I will rewrite this to step-canje.tsx
import { useReservationStore } from "@/lib/reservation-store";
import { useCuponStore } from "@/lib/cupon-store";
import type { BookingData } from "@/types/booking";
import Image from "next/image";
import { useCleanupStorage } from "@/hooks/useCleanupStorage";
import { useRouter } from "next/navigation";
import { StepCanje } from "./step-canje";
import { couponService } from "@/lib/services/couponService";

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
}

export function RedemptionFlow({ initialCuponCode = '', initialRut = '', onFinishRedemption }: RedemptionFlowProps) {
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

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev: BookingData) => ({ ...prev, ...data }));
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Validando cupón...</p>
      </div>
    );
  }

  if (!cuponInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Cupón Inválido</h2>
          <p>No se pudo validar el cupón proporcionado. Por favor, vuelve al dashboard e intenta nuevamente.</p>
          <Button className="mt-6" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-10 w-40">
                <Image src="/logo-pullman.png" alt="Pullman Bus" fill className="object-contain" />
              </div>
              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-bold text-slate-800">Canje de Cupón</span>
                <span className="text-xs text-slate-500">{cuponInfo.codigo}</span>
              </div>
            </div>

            <div className="flex items-center justify-between overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <div className="flex items-center gap-2 min-w-max">
                {steps.map((step, idx) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.id}>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" :
                        isCompleted ? "bg-primary/10 text-primary" : "text-slate-400"
                      }`}>
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                          isActive ? "bg-white/20" :
                          isCompleted ? "bg-primary/20" : "bg-slate-100"
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="hidden sm:inline">{step.name}</span>
                      </div>
                      {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 container mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
      </main>
    </div>
  );
}

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
