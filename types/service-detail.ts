export interface BusLayout {
  total_seats: number;
  coach_details: string;
  available: string;
  ladies_seats: string;
  gents_seats: string;
  ladies_booked_seats: string;
  fares_hash: {
    [key: string]: {
      Adult: string;
    };
  };
  o_availabity: string;
  floor: string;
}

export interface ServiceDetail {
  id: number;
  name: string;
  number: string;
  service_name: string;
  origin_id: number;
  destination_id: number;
  travel_date: string;
  travel_id: number;
  travels_name: string;
  route_id: number;
  available_seats: number;
  dep_time: string;
  duration: string;
  arr_time: string;
  bus_type: string;
  cost: string;
  can_cancel: boolean;
  amenities: string;
  bus_layout: BusLayout;
  boarding_stages: string;
  dropoff_stages?: string;
  boardingFirst: string | null;
  dropoffLast: string | null;
  terminalOrigen: string | null;
  terminalDestino: string | null;
}

export interface Seat {
  number: string;
  price: number;
  basePrice: number;
  available: boolean;
  type?: string;
  row: number;
  position: number;
}
