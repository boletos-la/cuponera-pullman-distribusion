import { NextResponse } from "next/server";

type City = {
  id: number;
  name: string;
  origin_count: number;
  destination_count: number;
};

// Función para normalizar texto (remover tildes)
const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

export async function GET(request: Request) {
  try {
    // Obtener parámetro de búsqueda
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";

    const isProd = process.env.NEXT_PUBLIC_KUPOS_ENV === "prod";
    const apiKey = isProd
      ? process.env.NEXT_PUBLIC_KUPOS_API_KEY_PROD
      : process.env.NEXT_PUBLIC_KUPOS_API_KEY_DEV;
    const URL_KUPOS = isProd
      ? process.env.NEXT_PUBLIC_URL_KUPOS_PROD
      : process.env.NEXT_PUBLIC_URL_KUPOS_DEV;

    if (!apiKey) {
      return NextResponse.json(
        { error: "KUPOS_API_KEY no configurada" },
        { status: 500 },
      );
    }

    const res = await fetch(`${URL_KUPOS}/cities.json?api_key=${apiKey}`, {
      cache: "no-cache",
    });

    const data = await res.json();

    const [headers, ...rows] = data.result;

    let cities: City[] = rows.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      origin_count: row[2],
      destination_count: row[3],
    }));

    // Filtrar ciudades con nombres inválidos y excluir la ciudad con ID 6832
    cities = cities.filter(
      (c) =>
        !c.name.toLowerCase().includes("hackedbykode") &&
        c.id !== 6832 &&
        String(c.id) !== "6832",
    );

    // Si hay una búsqueda, filtrar insensible a tildes
    if (searchQuery) {
      const normalizedSearch = normalizeText(searchQuery);

      cities = cities.filter((city) => {
        const normalizedCityName = normalizeText(city.name);
        return normalizedCityName.includes(normalizedSearch);
      });
    }

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Kupos error:", error);
    return NextResponse.json(
      { error: "Error al obtener ciudades" },
      { status: 500 },
    );
  }
}
