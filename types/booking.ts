export interface BookingData {
  validationType: "rut" | "code" | null;
  rut: string;
  convenioCode: string;
  convenioName: string;
  convenioDiscount: number;
  convenioId?: string;
  convenioDescuentoId?: number;
  empresaConvenio?: string;
  empresaId?: number | null;
  empresa_nombre?: string;
  origin: string;
  originId?: number;
  destination: string;
  destinationId?: number;
  date: Date | undefined;
  departureTime: string;
  arrivalTime: string;
  busType: string;
  selectedSeats: string[];
  passengerName: string;
  passengerRut: string;
  passengerEmail: string;
  pasajeroNombre?: string;
  pasajeroApellidos?: string;
  tripType?: "departure" | "return" | "both";
  travel_name?: string;
  travelId?: number;
  routeId?: number;
  seats?: string[];
  passengers?: Array<{
    id: string;
    nombre: string;
    rut: string;
    correo: string;
    telefono?: string;
  }>;
  pnrNumbers?: string[];
  bookingTime?: string;
  terminalOrigen?: string | null;
  terminalDestino?: string | null;
  bookingDataArray?: Array<{
    seat: string;
    pnrNumber: string;
    passenger: {
      id: string;
      nombre: string;
      rut: string;
      correo: string;
      telefono?: string;
    };
    bookingTime: string;
  }>;
  tripPrice: number;
  totalPrice?: number;
  paymentStatus: "pending" | "processing" | "completed" | "failed";
  transactionId: string;
  gdsData?: {
    boardingAt?: string;
    boardingAddress?: string;
    boardingTime?: string;
    dropOffAt?: string;
    dropOffAddress?: string;
    arrivalTime?: string;
    operatorPnr?: string;
    qrCodeUrl?: string;
  };
  returnDate?: Date;
  returnOrigin?: string;
  returnDestination?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnSeats?: string[];
  returnTravelName?: string;
  returnPnrNumbers?: string[];
  returnPrice?: number;
  returnTotalPrice?: number;
  returnTerminalOrigen?: string | null;
  returnTerminalDestino?: string | null;
  errorMessage?: string;
}

export interface BookingRequest {
  serviceId: string;
  seatNumber: string;
  price: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  originId: number;
  destinationId: number;
  travelDate: string;
}

export interface BookingResponse {
  success: boolean;
  pnrNumber: string;
  operatorPnr: string;
  travelId: number;
  travelName: string;
  seatNumber: string;
  bookingDate: string;
}

export interface ConfirmRequest {
  pnrNumber: string;
}

export interface ConfirmResponse {
  success: boolean;
  pnrNumber: string;
  ticketNumber: string;
  operatorPnr: string;
  ticketStatus: string;
  travelName: string;
  serviceNumber: string;
  origin: string;
  destination: string;
  travelDate: string;
  departureTime: string;
  duration: string;
  seatNumbers: string;
  totalFare: number;
  busType: string;
  boardingPoint: {
    name: string;
    dep_time: string;
    boarding_stage_address: string;
    landmark: string;
    contact_numbers: string;
    stage_id: string;
    op_stage_id: string;
  };
  passengerDetails: {
    title: string;
    gender: string | null;
    name: string;
    age: number;
    mobile: string;
    email: string;
  };
  seatFareDetails: Array<{
    seat_detail: {
      seat_number: string;
      fare: number;
      api_fare: number;
      seat_type: string;
    };
  }>;
  qrCode?: string;
  boardingQrCodes?: {
    [key: string]: string;
  };
  confirmedAt: string;
}
