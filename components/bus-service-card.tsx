"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Bus,
  ArrowRight,
} from "lucide-react";
import { ServiceDetailDialog } from "@/components/service-detail-dialog";


interface BusService {
  id: number;
  number: string;
  name: string;
  operator_service_name: string;
  origin_id: number;
  destination_id: number;
  route_id: number;
  travel_id: number;
  bus_type: string;
  dep_time: string;
  arr_time: string;
  duration: string;
  available_seats: number;
  total_seats: number;
  fare_str: string;
  is_cancellable: boolean;
  amenities: string | null;
  travel_name: string;
  is_direct_trip: boolean;
  cost: number;
  boardingFirst: string | null;
  dropoffLast: string | null;
  terminalOrigen: string | null;
  terminalDestino: string | null;
  travel_date: string;
  originName?: string;
  destinationName?: string;
}

interface BusServiceCardProps {
  service: BusService;
  tripType?: "departure" | "return";
  onNext?: () => void;
  isRoundTrip?: boolean;
}

export function BusServiceCard({
  service,
  tripType,
  onNext,
  isRoundTrip = false,
}: BusServiceCardProps) {
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const availabilityPercentage =
    (service.available_seats / service.total_seats) * 100;


  const getAvailabilityVariant = () => {
    if (service.available_seats === 0) return "destructive";
    if (availabilityPercentage < 30) return "secondary";
    return "default";
  };

  const getAvailabilityText = () => {
    if (service.available_seats === 0) return "Agotado";
    if (service.available_seats < 10)
      return `¡Últimos ${service.available_seats}!`;
    return `${service.available_seats} asientos`;
  };

  const getMainBusType = (busType: string | null | undefined): string => {
    if (!busType) return "";
    const parts = busType.split(",").map((p) => p.trim());
    const ignore = ["2+2", "2+1", "AC", "Video", "WiFi", "Baño"];
    const main = parts.find((p) => !ignore.includes(p));
    return main || parts[0];
  };

  const getAmenities = () => {
    const amenities = [];
    if (service.bus_type?.includes("AC")) amenities.push("Aire Acondicionado");
    if (
      service.bus_type?.includes("WiFi") ||
      service.amenities?.includes("wifi")
    )
      amenities.push("WiFi");
    if (service.bus_type?.includes("Video")) amenities.push("Entretenimiento");
    return amenities;
  };

  const amenities = getAmenities();

  // Obtener costo base desde fare_str
  const getCostoBase = (): number => {
    if (service.fare_str) {
      const fareMatch = service.fare_str.match(/\$?([0-9,]+)/);
      if (fareMatch) {
        return parseInt(fareMatch[1].replace(/,/g, ""), 10);
      }
    }
    return 0;
  };

  const costoBase = getCostoBase();

  // Para el canje, el costo final es 0
  const precioFinal = 0;
  const tieneDescuento = true;

  const getDescuentoTexto = (): string => {
    return "Canje de Cupón (100% DCTO)";
  };

  const displayOrigin = service.originName || "";
  const displayDestination = service.destinationName || "";

  // Función para formatear la fecha
  const formatTravelDate = (dateString?: string): string => {
    if (!dateString) return "";

    try {
      const [year, month, day] = dateString.split("-").map(Number);
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
      return `${day} de ${months[month - 1]} del ${year}`;
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return dateString;
    }
  };

  return (
    <>
      <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg gap-0 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Bus className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-bold text-base sm:text-lg truncate">
                  Pullman Bus - {getMainBusType(service.bus_type) || "Clásico"}
                </span>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {tripType === "departure" ? "Ida" : "Vuelta"}
                </Badge>
                {isRoundTrip && tripType === "departure" && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0"
                  >
                    Ida y Vuelta
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">{displayOrigin}</span>
                <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-50" />
                <span className="truncate">{displayDestination}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-semibold flex-shrink-0">Origen:</span>
                  <span className="text-muted-foreground truncate">
                    {service.boardingFirst || "—"}
                  </span>
                </div>
                <ArrowRight className="h-3 w-3 hidden sm:block flex-shrink-0 opacity-50" />
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-semibold flex-shrink-0">Llegada:</span>
                  <span className="text-muted-foreground truncate">
                    {service.dropoffLast || "—"}
                  </span>
                </div>
              </div>
            </div>

            <Badge
              variant={getAvailabilityVariant()}
              className="self-start sm:self-auto text-xs sm:text-sm whitespace-nowrap"
            >
              {getAvailabilityText()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="text-left min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Salida
              </p>
              <p className="font-bold text-base sm:text-lg">
                {service.dep_time}
              </p>
              {service.travel_date && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                  {formatTravelDate(service.travel_date).split("del")[0]}
                  <span className="hidden sm:inline">
                    {" "}
                    del {formatTravelDate(service.travel_date).split("del")[1]}
                  </span>
                </p>
              )}
            </div>

            <div className="text-center min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 justify-center">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="hidden sm:inline">Duración</span>
              </p>
              <p className="font-bold text-sm sm:text-base">
                {service.duration}
              </p>
            </div>

            <div className="text-right min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Llegada
              </p>
              <p className="font-bold text-base sm:text-lg">
                {service.arr_time}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                <span className="sm:hidden">
                  {service.total_seats - service.available_seats}/
                  {service.total_seats}
                </span>
                <span className="hidden sm:inline">
                  {service.total_seats - service.available_seats} de{" "}
                  {service.total_seats} ocupados
                </span>
              </span>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                {/* Badge de descuento movido arriba */}
                {tieneDescuento && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
                      {getDescuentoTexto()}
                    </span>
                  </Badge>
                )}

                {/* Precio con descuento */}
                <div className="flex items-baseline gap-1 text-xl sm:text-2xl font-bold text-primary">
                  <span className="text-sm">$</span>
                  <span className="break-all">
                    {precioFinal.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>

              {/* Precio original tachado */}
              {tieneDescuento && precioFinal !== costoBase && (
                <span className="text-xs text-muted-foreground line-through">
                  ${costoBase.toLocaleString("es-CL")}
                </span>
              )}
            </div>
          </div>

          {service.bus_type && (
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-muted-foreground">
                <strong className="font-semibold">Tipo:</strong>{" "}
                {getMainBusType(service.bus_type)}
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {amenities.map((amenity, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-[10px] sm:text-xs"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1 mb-5">
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>Disponibilidad</span>
              <span>{Math.round(availabilityPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  availabilityPercentage > 50
                    ? "bg-green-600/50"
                    : availabilityPercentage > 20
                      ? "bg-yellow-600/50"
                      : "bg-red-600/50"
                }`}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={() => setShowServiceDetail(true)}
            disabled={service.available_seats === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-200 text-sm sm:text-base"
            size="default"
          >
            {service.available_seats === 0 ? (
              "Agotado"
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="truncate">Seleccionar Asiento</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <ServiceDetailDialog
        serviceId={service.id}
        open={showServiceDetail}
        onOpenChange={setShowServiceDetail}
        terminalOrigen={service.boardingFirst}
        terminalDestino={service.dropoffLast}
        tripType={tripType}
        onNext={onNext}
        isRoundTrip={isRoundTrip}
        originName={displayOrigin}
        destinationName={displayDestination}
      />
    </>
  );
}
