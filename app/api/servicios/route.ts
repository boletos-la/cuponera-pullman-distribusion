import { NextResponse } from 'next/server';
import { Servicio, Asiento } from '@/lib/dataStore';

// Generador de Asientos de Bus (44 asientos: Piso 1 Salón Cama 12 asientos, Piso 2 Semi Cama 32 asientos)
function generateBusSeats(): Asiento[] {
  const seats: Asiento[] = [];
  // Piso 1: 1 a 12 (Salón Cama)
  for (let i = 1; i <= 12; i++) {
    seats.push({
      numero: i,
      piso: 1,
      tipo: 'Salón Cama',
      // Ocupamos aleatoriamente un par de asientos para demostrar interactividad real
      estado: i % 5 === 0 ? 'Ocupado' : 'Disponible',
    });
  }
  // Piso 2: 13 a 44 (Semi Cama)
  for (let i = 13; i <= 44; i++) {
    seats.push({
      numero: i,
      piso: 2,
      tipo: 'Semi Cama',
      estado: i % 7 === 0 ? 'Ocupado' : 'Disponible',
    });
  }
  return seats;
}

function generateServicesForTramoAndDate(tramo: string, fecha: string): Servicio[] {
  const parts = tramo.split('-');
  const origen = parts[0] || 'Santiago';
  const destino = parts[1] || 'Destino';
  const sanitize = tramo.replace(/[^a-zA-Z0-9]/g, '');

  const horarios = [
    { horaSalida: "07:30", horaLlegada: "09:15", bus: "Salón Cama / Semi Cama", patente: "KPR-982", idSuffix: "1" },
    { horaSalida: "10:15", horaLlegada: "12:00", bus: "Salón Cama", patente: "JY-8821", idSuffix: "2" },
    { horaSalida: "14:30", horaLlegada: "16:15", bus: "Semi Cama", patente: "LK-4412", idSuffix: "3" },
    { horaSalida: "18:00", horaLlegada: "19:45", bus: "Salón Cama", patente: "PC-9912", idSuffix: "4" },
  ];

  return horarios.map((h) => ({
    id: `SRV-${sanitize}-${fecha}-${h.idSuffix}`,
    codigoServicio: `PCC-${Math.floor(100 + Math.random() * 800)}`,
    origen: origen,
    destino: destino,
    tramo: tramo,
    fecha: fecha,
    horaSalida: h.horaSalida,
    horaLlegada: h.horaLlegada,
    tipoBus: h.bus,
    patente: h.patente,
    precioRegular: 7500,
    asientos: generateBusSeats()
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tramo = searchParams.get('tramo');
  const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
  const cuponCodigo = searchParams.get('cuponCodigo');

  // Simulamos que el cupón es válido independientemente del código para permitir la demo del UI
  // ya que la integración GDS no está lista en el backend real.
  
  let targetTramo = tramo || 'Santiago-Viña Del Mar';
  let cuponNombre = "Cuponera Validada";
  let tramosList = [targetTramo];

  if (cuponCodigo) {
    try {
      const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api'}/coupons/catalog`);
      const catData = await catRes.json();
      if (catData && catData.success && Array.isArray(catData.data)) {
        const idNum = parseInt(cuponCodigo.replace(/\D/g, ''));
        // Si el id coincide con cuponera_id o usuario_cuponera
        const match = catData.data.find((c: any) => c.id === idNum || (idNum >= 13 && c.nombre.includes('PUERTO MONTT')));
        if (match) {
          targetTramo = match.tramos?.[0] || targetTramo;
          tramosList = match.tramos || [targetTramo];
          cuponNombre = match.nombre;
        }
      }
    } catch (e) {}

    const targetFecha = fecha;
    const serviciosFiltrados = generateServicesForTramoAndDate(targetTramo, targetFecha);

    return NextResponse.json({
      success: true,
      cuponValido: {
        codigo: cuponCodigo,
        nombreCuponera: cuponNombre,
        tramosPermitidos: tramosList,
        fechaVencimiento: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        totalCupones: 10,
        cuponesUsados: 0,
        saldoDisponible: 10
      },
      servicios: serviciosFiltrados
    });
  }

  const serviciosFiltrados = generateServicesForTramoAndDate(targetTramo, fecha);
  return NextResponse.json({ success: true, servicios: serviciosFiltrados });
}
