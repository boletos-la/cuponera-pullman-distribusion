"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ComboBox } from "@/components/ui/combobox";
import {
  Search,
  MapPin,
  Calendar,
  Loader2,
  ArrowLeftRight,
  ArrowRightLeft,
  CheckCircle2,
  X,
  ArrowLeft,
} from "lucide-react";
import { BusServiceCard } from "@/components/bus-service-card";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { Badge } from "@/components/ui/badge";
import { useCuponStore } from "@/lib/cupon-store";
import { getApiUrl, getDistribusionApiUrl } from "@/lib/apiClient";
import { BusRouteLoader } from "@/components/ui/custom-loaders";
import { useReservationStore } from "@/lib/reservation-store";

interface City {
  id: number | string;
  name: string;
  origin_count: number;
  destination_count: number;
}

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
  boarding_stages: string;
  dropoff_stages: string;
  boardingFirst: string | null;
  dropoffLast: string | null;
  terminalOrigen: string | null;
  terminalDestino: string | null;
  travel_date: string;
  originName: string;
  destinationName: string;
}

interface TravelSearchProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function TravelSearch({ onNext, onBack }: TravelSearchProps) {
  // Estados para la búsqueda
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [selectedDepartureDate, setSelectedDepartureDate] =
    useState<Date | null>(null);
  const [selectedReturnDate, setSelectedReturnDate] = useState<Date | null>(
    null,
  );
  const [departureDateString, setDepartureDateString] = useState("");
  const [returnDateString, setReturnDateString] = useState("");
  const [searchMode, setSearchMode] = useState<"departure" | "return">(
    "departure",
  );

  // Estados para resultados
  const [departureServices, setDepartureServices] = useState<BusService[]>([]);
  const [returnServices, setReturnServices] = useState<BusService[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReturn, setIsLoadingReturn] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Estado para controlar si ya se reservó la ida
  const [departureBooked, setDepartureBooked] = useState(false);

  // Ref para trackear las ciudades originales de ida
  const originalCitiesRef = useRef<{
    origin: City | null;
    destination: City | null;
  }>({ origin: null, destination: null });

  const getTodayLocalStart = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const todayForMinDate = useMemo(() => getTodayLocalStart(), []);

  // Determinar si es viaje de ida y vuelta (si hay fecha de vuelta seleccionada)
  const isRoundTrip = selectedReturnDate !== null;

  // Función para manejar el avance a payment
  const handleAdvanceToPayment = () => {
    if (onNext) {
      onNext();
    }
  };

  const releaseGdsBookings = async () => {
    try {
      const departureBooking = useReservationStore.getState().getDepartureBooking();
      if (departureBooking && departureBooking.bookingData) {
        for (const b of departureBooking.bookingData) {
          if (b.pnrNumber && b.seat) {
            await fetch(`${getApiUrl()}/gds/cancel`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket_number: b.pnrNumber, seat_numbers: b.seat })
            });
          }
        }
      }
      useReservationStore.getState().clearAll();
    } catch (e) {
      console.error("Error al liberar reservas en GDS", e);
    }
  };

  const handleBack = () => {
    if (searchMode === "return") {
      setSearchMode("departure");
      setDepartureBooked(false);
      setReturnServices([]);
      releaseGdsBookings();
      return;
    }
    if (onBack) {
      releaseGdsBookings();
      onBack();
    }
  };

  useEffect(() => {
    const loadCities = async () => {
      try {
        const gdsProvider = process.env.NEXT_PUBLIC_GDS_PROVIDER || 'kupos';
        const url = gdsProvider === 'distribusion' 
          ? `${getDistribusionApiUrl()}/distribusion/stations` 
          : `${getApiUrl()}/gds/cities`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error loading cities");
        const data = await res.json();
        const allCities = (data.cities || []) as City[];
        const cuponInfo = useCuponStore.getState().cuponInfo;
        let filteredCities: City[] = allCities;
        
        let autoOrigin: City | null = null;
        let autoDestination: City | null = null;
        
        if (cuponInfo && cuponInfo.tramosPermitidos && cuponInfo.tramosPermitidos.length > 0) {
          const normalizeText = (text: string): string => {
            if (!text) return "";
            return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          };

          const validCityNames = new Set<string>();
          cuponInfo.tramosPermitidos.forEach((tramo: string) => {
            const [origen, destino] = tramo.split('-').map(s => normalizeText(s));
            if (origen) validCityNames.add(origen);
            if (destino) validCityNames.add(destino);
            
            if (!autoOrigin && !autoDestination && origen && destino) {
              const matchedOrigin = allCities.find(c => normalizeText(c.name) === origen);
              const matchedDest = allCities.find(c => normalizeText(c.name) === destino);
              if (matchedOrigin && matchedDest) {
                autoOrigin = matchedOrigin;
                autoDestination = matchedDest;
              }
            }
          });
          
          filteredCities = allCities.filter((city: City) => {
            return city && validCityNames.has(normalizeText(city.name));
          });
        }
        setCities(filteredCities);

        if (autoOrigin && autoDestination) {
          setOrigin(autoOrigin);
          setDestination(autoDestination);
        }
      } catch (error) {
        console.error("Error cargando ciudades:", error);
        setSearchError("Error al cargar las ciudades");
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, []);

  // Guardar ciudades originales cuando se hace búsqueda de ida
  useEffect(() => {
    if (searchMode === "departure" && origin && destination) {
      originalCitiesRef.current = { origin, destination };
    }
  }, [searchMode, origin, destination]);

  // Escuchar evento de reserva exitosa de ida
  useEffect(() => {
    const handleDepartureBooked = () => {
      setDepartureBooked(true);

      // Si hay fecha de vuelta seleccionada, buscar automáticamente la vuelta
      if (
        selectedReturnDate &&
        originalCitiesRef.current.origin &&
        originalCitiesRef.current.destination
      ) {
        const { origin: originalOrigin, destination: originalDestination } =
          originalCitiesRef.current;

        const returnOriginCity =
          cities.find((c) => c.id === originalDestination?.id) ||
          originalDestination;
        const returnDestinationCity =
          cities.find((c) => c.id === originalOrigin?.id) || originalOrigin;

        setOrigin(returnOriginCity);
        setDestination(returnDestinationCity);

        setSearchMode("return");
        setHasSearched(false);
        setReturnServices([]);

        if (returnDateString) {
          handleReturnSearch(returnOriginCity, returnDestinationCity);
        }
      } else {
        if (onNext) {
          setTimeout(() => {
            onNext();
          }, 500);
        }
      }
    };

    window.addEventListener("departureBooked", handleDepartureBooked);

    return () => {
      window.removeEventListener("departureBooked", handleDepartureBooked);
    };
  }, [selectedReturnDate, returnDateString, onNext, cities]);

  // Escuchar evento para continuar con la vuelta (desde el modal de éxito)
  useEffect(() => {
    const handleContinueToReturn = () => {
      setDepartureBooked(true);

      if (
        originalCitiesRef.current.origin &&
        originalCitiesRef.current.destination
      ) {
        const { origin: originalOrigin, destination: originalDestination } =
          originalCitiesRef.current;

        const returnOriginCity =
          cities.find((c) => c.id === originalDestination?.id) ||
          originalDestination;
        const returnDestinationCity =
          cities.find((c) => c.id === originalOrigin?.id) || originalOrigin;

        setOrigin(returnOriginCity);
        setDestination(returnDestinationCity);
      }

      setSearchMode("return");
      setDepartureServices([]);
      setHasSearched(false);
      setReturnServices([]);

      if (
        returnDateString &&
        originalCitiesRef.current.origin &&
        originalCitiesRef.current.destination
      ) {
        const { origin: originalOrigin, destination: originalDestination } =
          originalCitiesRef.current;

        const returnOriginCity =
          cities.find((c) => c.id === originalDestination?.id) ||
          originalDestination;
        const returnDestinationCity =
          cities.find((c) => c.id === originalOrigin?.id) || originalOrigin;

        handleReturnSearch(returnOriginCity, returnDestinationCity);
      }
    };

    window.addEventListener("continueToReturn", handleContinueToReturn);

    return () => {
      window.removeEventListener("continueToReturn", handleContinueToReturn);
    };
  }, [returnDateString, cities]);

  const availableDestinations = useMemo(() => {
    if (!origin) return [];
    const cuponInfo = useCuponStore.getState().cuponInfo;
    if (cuponInfo && cuponInfo.tramosPermitidos && cuponInfo.tramosPermitidos.length > 0) {
      const normalizeText = (text: string): string => {
        if (!text) return "";
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      };

      const validDestinationCodes = new Set<string>();
      cuponInfo.tramosPermitidos.forEach((tramo: string) => {
        const parts = tramo.split("-");
        if (parts.length === 2) {
          const [origenTramo, destinoTramo] = parts.map(s => normalizeText(s));
          const normalizedOrigin = normalizeText(origin.name);
          
          if (origenTramo === normalizedOrigin) {
            const destCity = cities.find(c => normalizeText(c.name) === destinoTramo);
            if (destCity) validDestinationCodes.add(destCity.id.toString());
          }
          if (destinoTramo === normalizedOrigin) {
            const destCity = cities.find(c => normalizeText(c.name) === origenTramo);
            if (destCity) validDestinationCodes.add(destCity.id.toString());
          }
        }
      });
      return cities.filter(
        (city) =>
          city.id !== origin.id &&
          validDestinationCodes.has(city.id.toString()),
      );
    }
    return cities.filter((city) => city.id !== origin.id);
  }, [origin, cities]);

  const handleReturnSearch = async (
    returnOrigin: City,
    returnDestination: City,
  ) => {
    if (!returnOrigin || !returnDestination || !returnDateString) {
      setReturnServices([]);
      setHasSearched(true);
      return;
    }

    setIsLoadingReturn(true);
    setHasSearched(true);
    setSearchError(null);

      try {
        const gdsProvider = process.env.NEXT_PUBLIC_GDS_PROVIDER || 'kupos';
        let res;

        if (gdsProvider === 'distribusion') {
          const url = `${getDistribusionApiUrl()}/distribusion/connections/find`;
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originStationCode: returnOrigin.id.toString(),
              destinationStationCode: returnDestination.id.toString(),
              departureDate: returnDateString
            })
          });
        } else {
          const params = new URLSearchParams({
            originId: returnOrigin.id.toString(),
            destinationId: returnDestination.id.toString(),
            date: returnDateString,
          });
          const url = `${getApiUrl()}/gds/search?${params}`;
          res = await fetch(url);
        }

        if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.error || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || data.error);

      const mapped =
        data.services?.map((s: any) => ({
          ...s,
          originName: returnOrigin.name,
          destinationName: returnDestination.name,
          boardingFirst: getFirstTerminal(s.boarding_stages),
          dropoffLast: getLastTerminal(s.dropoff_stages),
        })) ?? [];

      setReturnServices(mapped);
    } catch (error) {
      console.error("Error searching return services:", error);
      setSearchError(
        error instanceof Error
          ? error.message
          : "Error al buscar servicios de vuelta",
      );
      setReturnServices([]);
    } finally {
      setIsLoadingReturn(false);
    }
  };

  const swapCities = () => {
    if (origin && destination) {
      const temp = origin;
      setOrigin(destination);
      setDestination(temp);
    } else if (origin && !destination) {
      setDestination(origin);
      setOrigin(null);
    } else if (!origin && destination) {
      setOrigin(destination);
      setDestination(null);
    }
  };

  function getFirstTerminal(stageString: string) {
    if (!stageString) return null;
    const parts = stageString
      .split("||")
      .map((p) => p.trim())
      .filter(Boolean);
    return cleanTerminalName(parts[1] || parts[0]);
  }

  function getLastTerminal(stageString: string) {
    if (!stageString) return null;
    const parts = stageString
      .split("||")
      .map((p) => p.trim())
      .filter(Boolean);
    return cleanTerminalName(parts[parts.length - 1]);
  }

  function cleanTerminalName(str: string) {
    return str.split(",")[0].trim();
  }

  const handleSearch = async () => {
    if (searchMode === "departure") {
      if (!origin || !destination || !departureDateString) {
        setDepartureServices([]);
        setHasSearched(true);
        return;
      }
    } else {
      if (!origin || !destination || !returnDateString) {
        setReturnServices([]);
        setHasSearched(true);
        return;
      }
    }

    if (searchMode === "departure") {
      setIsLoading(true);
    } else {
      setIsLoadingReturn(true);
    }

    setHasSearched(true);
    setSearchError(null);

      try {
        const searchOrigin = origin;
        const searchDestination = destination;
        const searchDate =
          searchMode === "departure" ? departureDateString : returnDateString;

        if (!searchOrigin || !searchDestination) {
          throw new Error("Ciudades no definidas");
        }

        const gdsProvider = process.env.NEXT_PUBLIC_GDS_PROVIDER || 'kupos';
        let res;

        if (gdsProvider === 'distribusion') {
          const url = `${getDistribusionApiUrl()}/distribusion/connections/find`;
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originStationCode: searchOrigin.id.toString(),
              destinationStationCode: searchDestination.id.toString(),
              departureDate: searchDate
            })
          });
        } else {
          const params = new URLSearchParams({
            originId: searchOrigin.id.toString(),
            destinationId: searchDestination.id.toString(),
            date: searchDate,
          });
          const url = `${getApiUrl()}/gds/search?${params}`;
          res = await fetch(url);
        }

        if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.error || `Error: ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || data.error);

      const mapped =
        data.services?.map((s: any) => ({
          ...s,
          originName: searchOrigin.name,
          destinationName: searchDestination.name,
          boardingFirst: getFirstTerminal(s.boarding_stages),
          dropoffLast: getLastTerminal(s.dropoff_stages),
        })) ?? [];

      if (searchMode === "departure") {
        setDepartureServices(mapped);
      } else {
        setReturnServices(mapped);
      }
    } catch (error) {
      console.error("Error searching services:", error);
      setSearchError(
        error instanceof Error ? error.message : "Error al buscar servicios",
      );

      if (searchMode === "departure") {
        setDepartureServices([]);
      } else {
        setReturnServices([]);
      }
    } finally {
      if (searchMode === "departure") {
        setIsLoading(false);
      } else {
        setIsLoadingReturn(false);
      }
    }
  };

  const handleDepartureDateChange = (selectedDate: Date | null) => {
    setSelectedDepartureDate(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setDepartureDateString(`${year}-${month}-${day}`);
    } else {
      setDepartureDateString("");
    }
  };

  const handleReturnDateChange = (selectedDate: Date | null) => {
    setSelectedReturnDate(selectedDate);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setReturnDateString(`${year}-${month}-${day}`);
    } else {
      setReturnDateString("");
      if (searchMode === "return") {
        setSearchMode("departure");
        setDepartureBooked(false);
        setReturnServices([]);
      }
    }
  };

  const isSearchDisabled =
    searchMode === "departure"
      ? !origin || !destination || !departureDateString || isLoading
      : !origin || !destination || !returnDateString || isLoadingReturn;

  const isSwapDisabled = !origin && !destination;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const currentServices =
    searchMode === "departure" ? departureServices : returnServices;
  const currentLoading =
    searchMode === "departure" ? isLoading : isLoadingReturn;

  if (isLoadingCities) {
    return (
      <div className="container min-h-screen mx-auto px-4 py-20 h-full">
        <div className="flex flex-col items-center justify-center">
          <div className="h-8 w-8 rounded-md border-4 border-primary/20 border-t-primary animate-spin mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="container 2xl:max-w-[1300px] min-h-screen mx-auto px-4 pb-8 h-full">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Busca tu Viaje</h1>
          <p className="text-lg text-muted-foreground">
            Encuentra los mejores servicios de buses para tu destino
          </p>
        </div>

        {/* Banner de progreso si es ida y vuelta */}
        {isRoundTrip && (
          <div className="bg-linear-to-r from-orange-50 to-indigo-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-orange-800 flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Viaje de Ida y Vuelta
                </h3>
                <p className="text-sm text-orange-600">
                  {searchMode === "departure"
                    ? "Paso 1: Busca y reserva tu viaje de ida"
                    : "Paso 2: Busca y reserva tu viaje de vuelta"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center ${
                      searchMode === "departure"
                        ? "bg-orange-600 text-white"
                        : departureBooked
                          ? "bg-green-600 text-white"
                          : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {departureBooked ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <span className="text-sm font-medium">Ida</span>
                </div>
                <div className="h-1 w-8 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-md flex items-center justify-center ${
                      searchMode === "return"
                        ? "bg-orange-600 text-white"
                        : departureBooked
                          ? "bg-orange-100 text-orange-800 border border-orange-300"
                          : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-sm font-medium">Vuelta</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Servicios de Buses
              {isRoundTrip && (
                <Badge variant="outline" className="ml-2">
                  {searchMode === "departure" ? "Ida" : "Vuelta"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {searchMode === "departure"
                ? `Busca y reserva tu viaje de ida: ${
                    origin?.name || "Origen"
                  } → ${destination?.name || "Destino"}`
                : `Busca tu viaje de vuelta: ${origin?.name || "Origen"} → ${
                    destination?.name || "Destino"
                  }`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:gap-2 lg:gap-4 items-end grid-cols-1 md:grid-cols-[1fr_auto_1fr] lg:grid-cols-[1fr_auto_1fr_1fr_1fr]">
              {/* ORIGEN */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {searchMode === "departure" ? "Origen" : "Origen (vuelta)"}
                </Label>
                <ComboBox
                  items={cities.map((city) => ({
                    label: city.name,
                    value: city.id.toString(),
                  }))}
                  value={origin?.id.toString() || ""}
                  onChange={(value) => {
                    const city = cities.find((c) => c.id.toString() === value);
                    setOrigin(city || null);
                  }}
                  placeholder={
                    isLoadingCities
                      ? "Cargando ciudades..."
                      : searchMode === "departure"
                        ? "Selecciona origen"
                        : "Selecciona origen de vuelta"
                  }
                  disabled={
                    isLoadingCities ||
                    (searchMode === "return" && !departureBooked)
                  }
                />
              </div>

              <div className="flex items-center justify-center h-10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={swapCities}
                  disabled={
                    isSwapDisabled ||
                    (searchMode === "return" && !departureBooked)
                  }
                  className="h-8 w-8 rounded-md border border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/10 transition-all duration-200"
                  title="Intercambiar origen y destino"
                >
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </Button>
              </div>

              {/* DESTINO */}
              <div className="space-y-2">
                <Label
                  htmlFor="destination"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  {searchMode === "departure" ? "Destino" : "Destino (vuelta)"}
                </Label>
                <ComboBox
                  items={availableDestinations.map((city) => ({
                    label: city.name,
                    value: city.id.toString(),
                  }))}
                  value={destination?.id.toString() || ""}
                  onChange={(value) => {
                    const city = cities.find((c) => c.id.toString() === value);
                    setDestination(city || null);
                  }}
                  placeholder={
                    searchMode === "departure"
                      ? "Selecciona destino"
                      : "Selecciona destino de vuelta"
                  }
                  disabled={
                    !origin ||
                    isLoadingCities ||
                    (searchMode === "return" && !departureBooked)
                  }
                />
              </div>

              <div className="md:col-span-3 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 justify-center">
                {/* FECHA IDA */}
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="departure-date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    Fecha Ida
                  </Label>
                  <ModernDatePicker
                    selected={selectedDepartureDate}
                    onChange={handleDepartureDateChange}
                    minDate={todayForMinDate}
                    placeholderText="Seleccionar fecha ida"
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>

                {/* FECHA VUELTA */}
                <div className="space-y-2 w-full">
                  <Label
                    htmlFor="return-date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    Fecha Vuelta
                  </Label>

                  <div className="relative w-full">
                    <ModernDatePicker
                      selected={selectedReturnDate}
                      onChange={handleReturnDateChange}
                      minDate={selectedDepartureDate || todayForMinDate}
                      placeholderText="Opcional"
                      disabled={isLoading}
                      className="w-full pr-9"
                    />

                    {selectedReturnDate && (
                      <button
                        type="button"
                        onClick={() => handleReturnDateChange(null)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-md bg-white p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                        aria-label="Borrar fecha de vuelta"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción según el modo */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {currentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {searchMode === "departure"
                      ? "Buscar Servicios de Ida"
                      : "Buscar Servicios de Vuelta"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mensajes de error */}
        {searchError && (
          <Card className="border-2 border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-center">
                <p className="font-medium">Error en la búsqueda</p>
                <p className="text-sm">{searchError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados de búsqueda */}
        {hasSearched && !searchError && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                  {searchMode === "departure" ? (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
                      <span className="wrap-break-words">
                        Viaje de Ida: {origin?.name} → {destination?.name}
                      </span>
                      {departureDateString && (
                        <span className="text-sm sm:text-lg font-normal text-muted-foreground">
                          ({formatDate(departureDateString)})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-5 w-5 text-primary rotate-180 shrink-0" />
                      <span className="wrap-break-words">
                        Viaje de Vuelta: {origin?.name} → {destination?.name}
                      </span>
                      {returnDateString && (
                        <span className="text-sm sm:text-lg font-normal text-muted-foreground">
                          ({formatDate(returnDateString)})
                        </span>
                      )}
                    </>
                  )}
                </h2>

                <Badge
                  variant="outline"
                  className="text-sm self-start sm:self-auto whitespace-nowrap"
                >
                  {currentLoading
                    ? "Buscando..."
                    : currentServices.length > 0
                      ? `${currentServices.length} servicio${
                          currentServices.length > 1 ? "s" : ""
                        } disponible${currentServices.length > 1 ? "s" : ""}`
                      : "No hay servicios"}
                </Badge>
              </div>

              {currentLoading && (
                <div className="py-12 bg-white rounded-md border border-slate-100 shadow-sm">
                  <BusRouteLoader message="Buscando los mejores recorridos para ti..." />
                </div>
              )}

              {!currentLoading && currentServices.length > 0 && (
                <div className="grid gap-4">
                  {currentServices.map((service) => (
                    <BusServiceCard
                      key={`${searchMode}-${service.id}`}
                      service={service}
                      tripType={searchMode}
                      onNext={handleAdvanceToPayment}
                      isRoundTrip={selectedReturnDate !== null}
                    />
                  ))}
                </div>
              )}

              {!currentLoading && currentServices.length === 0 && (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {searchMode === "departure"
                        ? "No hay servicios disponibles para esta ruta y fecha de ida"
                        : "No hay servicios disponibles para esta ruta y fecha de vuelta"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Intenta con otra combinación de origen, destino y fecha
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
