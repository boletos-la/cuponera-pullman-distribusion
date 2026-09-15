import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originId = searchParams.get("originId");
    const destinationId = searchParams.get("destinationId");
    const date = searchParams.get("date");

    if (!originId || !destinationId || !date) {
      return NextResponse.json(
        { error: "Missing required parameters: originId, destinationId, date" },
        { status: 400 },
      );
    }

    const originIdNum = parseInt(originId);
    const destinationIdNum = parseInt(destinationId);

    if (isNaN(originIdNum) || isNaN(destinationIdNum)) {
      return NextResponse.json(
        { error: "Invalid originId or destinationId" },
        { status: 400 },
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
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

    const apiUrl = `${URL_KUPOS}/ui_schedules/${originIdNum}/${destinationIdNum}/${date}.json?api_key=${apiKey}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Kupos API response not OK:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `Kupos API error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    const externalApiResponse = await response.json();

    if (
      externalApiResponse.result &&
      Array.isArray(externalApiResponse.result)
    ) {
      const headers = externalApiResponse.result[0] as string[];
      const servicesData = externalApiResponse.result.slice(1) as any[][];

      const formattedServices = servicesData.map((serviceArray) => {
        const serviceObject: { [key: string]: any } = {};

        headers.forEach((header, index) => {
          serviceObject[header] = serviceArray[index];
        });

        return serviceObject;
      });

      return NextResponse.json({
        services: formattedServices,
        meta: {
          total: formattedServices.length,
          originId: originIdNum,
          destinationId: destinationIdNum,
          date: date,
        },
      });
    }

    return NextResponse.json(externalApiResponse);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
