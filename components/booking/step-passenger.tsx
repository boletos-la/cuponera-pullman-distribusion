"use client";

import React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Bus, CreditCard, Mail, User, ArrowRight, ArrowLeft, Ticket } from "lucide-react";
import { useReservationStore } from "@/lib/reservation-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BookingData } from "@/types/booking";

interface StepPassengerProps {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Chilean RUT validation
function validateRut(rut: string): boolean {
  const cleanRut = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv =
    expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : String(expectedDv);

  return dv === calculatedDv;
}

function formatRut(value: string): string {
  const cleanValue = value.replace(/[^0-9kK]/g, "").toUpperCase();
  if (cleanValue.length <= 1) return cleanValue;

  const body = cleanValue.slice(0, -1);
  const dv = cleanValue.slice(-1);

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

import { getAuthUser } from "@/lib/apiClient";
import { useCuponStore } from "@/lib/cupon-store";

export function StepPassenger({
  bookingData,
  updateBookingData,
  onNext,
  onBack,
}: StepPassengerProps) {
  const authUser = getAuthUser();
  const cuponInfo = useCuponStore((state) => state.cuponInfo);
  const isAutofilled = !!authUser || !!cuponInfo;

  const defaultRut = bookingData.passengerRut || (cuponInfo?.rutUsuario ? formatRut(cuponInfo.rutUsuario) : (authUser?.rut ? formatRut(authUser.rut) : ""));
  const defaultName = bookingData.passengerName || cuponInfo?.nombreUsuario || authUser?.nombre || "";
  const defaultEmail = bookingData.passengerEmail || cuponInfo?.emailUsuario || authUser?.correo || "";

  const [name, setName] = useState(defaultName);
  const [rut, setRut] = useState(defaultRut);
  const [email, setEmail] = useState(defaultEmail);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cuponInfo) {
      if (!name && cuponInfo.nombreUsuario) setName(cuponInfo.nombreUsuario);
      if (!rut && cuponInfo.rutUsuario) setRut(formatRut(cuponInfo.rutUsuario));
      if (!email && cuponInfo.emailUsuario) setEmail(cuponInfo.emailUsuario);
    }
  }, [cuponInfo]);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    if (errors.rut) {
      setErrors((prev) => ({ ...prev, rut: "" }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (name.trim().split(" ").length < 2) {
      newErrors.name = "Ingresa nombre y apellido";
    }

    if (!rut) {
      newErrors.rut = "El RUT es requerido";
    } else if (!validateRut(rut)) {
      newErrors.rut = "RUT inválido";
    }

    if (!email) {
      newErrors.email = "El correo es requerido";
    } else if (!validateEmail(email)) {
      newErrors.email = "Correo inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const departureBooking = useReservationStore((state) => state.getDepartureBooking());
  const displayOrigin = departureBooking?.origin || bookingData.origin;
  const displayDestination = departureBooking?.destination || bookingData.destination;
  const displayDepartureTime = departureBooking?.dep_time || bookingData.departureTime;
  const displayArrivalTime = departureBooking?.arr_time || bookingData.arrivalTime;
  const displaySelectedSeats = departureBooking?.selectedSeats || bookingData.selectedSeats;

  const handleContinue = () => {
    if (validateForm()) {
      updateBookingData({
        passengerName: name,
        passengerRut: rut,
        passengerEmail: email,
      });
      onNext();
    }
  };

  const totalPrice = departureBooking?.totalPrice || departureBooking?.realPrice || (displaySelectedSeats.length * (bookingData.tripPrice || 0));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Datos del Pasajero
        </h2>
        <p className="text-muted-foreground">
          Ingresa la información del pasajero principal
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Passenger Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Los datos deben coincidir con tu documento de identidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez González"
                  value={name}
                  onChange={handleNameChange}
                  className={errors.name ? "border-destructive" : ""}
                  disabled={isAutofilled}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passenger-rut">RUT</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="passenger-rut"
                      placeholder="12.345.678-9"
                      value={rut}
                      onChange={handleRutChange}
                      maxLength={12}
                      className={`pl-10 ${errors.rut ? "border-destructive" : ""}`}
                      disabled={isAutofilled}
                    />
                  </div>
                  {errors.rut && (
                    <p className="text-sm text-destructive">{errors.rut}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@empresa.cl"
                      value={email}
                      onChange={handleEmailChange}
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Recibirás tu E-Ticket en el correo proporcionado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trip Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resumen del Viaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Route */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{displayOrigin}</p>
                    <p className="text-sm text-muted-foreground">
                      {displayDepartureTime} hrs
                    </p>
                  </div>
                </div>
                <div className="ml-2 border-l-2 border-dashed border-muted h-4" />
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{displayDestination}</p>
                    <p className="text-sm text-muted-foreground">
                      {displayArrivalTime} hrs
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    Fecha del Viaje
                  </div>
                  <span className="font-medium">
                    {departureBooking?.date ? format(new Date(departureBooking.date), "dd MMM yyyy", {
                      locale: es,
                    }) : (bookingData.date ? format(bookingData.date, "dd MMM yyyy", { locale: es }) : "")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Bus className="mr-2 h-4 w-4" />
                    Asiento(s)
                  </div>
                  <span className="font-medium">
                    {displaySelectedSeats.join(", ")}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asientos</span>
                  <span className="font-medium">
                    {displaySelectedSeats.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cantidad</span>
                  <span className="font-medium">
                    {displaySelectedSeats.length}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t space-y-2 px-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1 min-w-0 w-full">
                    <span className="font-semibold text-foreground block">Total a Pagar</span>
                    <Badge variant="outline" className="mt-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold py-1.5 px-2.5 flex items-center gap-1.5 shadow-none whitespace-normal text-left h-auto leading-tight">
                      <Ticket className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Se usará tu cupón para pagar</span>
                    </Badge>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    {totalPrice > 0 && (
                      <span className="text-sm font-semibold text-muted-foreground line-through block">
                        ${totalPrice.toLocaleString("es-CL")}
                      </span>
                    )}
                    <span className="text-3xl font-black text-emerald-600">
                      $0
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  onClick={handleContinue}
                >
                  Confirmar Compra
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={onBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
