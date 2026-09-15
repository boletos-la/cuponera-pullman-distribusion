import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticket_number: ticketNumber, seat_numbers: seatNumbers } = body;

    if (!ticketNumber || !seatNumbers) {
      return NextResponse.json(
        { error: "Missing required parameters: ticket_number, seat_numbers" },
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

    const apiUrl = `${URL_KUPOS}/cancel_booking.json?ticket_number=${ticketNumber}&seat_numbers=${seatNumbers}&api_key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { details: await response.text() };
      }

      return NextResponse.json(
        {
          error: `Kupos API error: ${response.status}`,
          ...errorData,
        },
        { status: response.status },
      );
    }

    const externalApiResponse = await response.json();

    // Si Kupos devuelve un código de error en el body (ej: 412), usarlo como status HTTP
    const responseCode = externalApiResponse?.response?.code;
    if (responseCode && responseCode >= 400) {
      return NextResponse.json(externalApiResponse, { status: responseCode });
    }

    return NextResponse.json(externalApiResponse);
  } catch (error) {
    console.error("Cancel API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
