import { NextRequest, NextResponse } from "next/server";

interface BusLayout {
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
  dropoff_stages: string;
}

// Usar params como primer argumento en App Router
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: serviceId } = await params;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 },
      );
    }

    const isProd = process.env.NEXT_PUBLIC_KUPOS_ENV === "prod";

    const apiKey = isProd
      ? process.env.NEXT_PUBLIC_KUPOS_API_KEY_PROD
      : process.env.NEXT_PUBLIC_KUPOS_API_KEY_DEV;

    const URL_KUPOS = isProd
      ? process.env.NEXT_PUBLIC_URL_KUPOS_PROD
      : process.env.NEXT_PUBLIC_URL_KUPOS_DEV;

    if (!apiKey || !URL_KUPOS) {
      return NextResponse.json(
        { error: "API configuration missing" },
        { status: 500 },
      );
    }

    const apiUrl = `${URL_KUPOS}/ui_schedule/${serviceId}.json?api_key=${apiKey}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Service detail API error:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        {
          error: `Service detail API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (!data.result) {
      return NextResponse.json(
        { error: "Invalid response from service detail API" },
        { status: 500 },
      );
    }

    const result = data.result;

    const serviceDetail: ServiceDetail = {
      id: result.id || 0,
      name: result.name || "",
      number: result.number || "",
      service_name: result.service_name || "",
      origin_id: result.origin_id || 0,
      destination_id: result.destination_id || 0,
      travel_date: result.travel_date || "",
      travel_id: result.travel_id || 0,
      travels_name: result.travels_name || "",
      route_id: result.route_id || 0,
      available_seats: result.available_seats || 0,
      dep_time: result.dep_time || "",
      duration: result.duration || "",
      arr_time: result.arr_time || "",
      bus_type: result.bus_type || "",
      cost: result.cost || "",
      can_cancel: Boolean(result.can_cancel),
      amenities: result.amenities || "",
      bus_layout: result.bus_layout || {
        total_seats: 0,
        coach_details: "",
        available: "",
        ladies_seats: "",
        gents_seats: "",
        ladies_booked_seats: "",
        fares_hash: {},
        o_availabity: "",
      },
      boarding_stages:
        result.bus_layout?.boarding_stages || result.boarding_stages || "",
      dropoff_stages:
        result.bus_layout?.dropoff_stages || result.dropoff_stages || "",
    };

    return NextResponse.json({
      service: serviceDetail,
      meta: {
        serviceId: serviceId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Service detail API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
