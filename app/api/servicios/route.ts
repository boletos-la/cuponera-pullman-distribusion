import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, INITIAL_SERVICIOS, generateBusSeats, Servicio, Cupon } from '@/lib/dataStore';

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

  let servicios = readJsonFile<Servicio[]>('servicios.json', INITIAL_SERVICIOS);

  // Si se pasa un código de cupón, validamos el contrato del cupón (Tramo restringido)
  if (cuponCodigo) {
    const cupones = readJsonFile<Cupon[]>('cupones.json', []);
    const cupon = cupones.find((c) => c.codigo === cuponCodigo);

    if (!cupon) {
      return NextResponse.json(
        { success: false, error: 'El cupón ingresado no existe.' },
        { status: 404 }
      );
    }

    const saldoActual = cupon.saldoDisponible !== undefined ? cupon.saldoDisponible : (cupon.estado === 'Activo' ? 1 : 0);

    if (cupon.estado !== 'Activo' || saldoActual <= 0) {
      return NextResponse.json(
        { success: false, error: `La cuponera ${cupon.codigo} no tiene saldo disponible (${saldoActual}/${cupon.totalCupones || 10} cupones) o no está activa.` },
        { status: 400 }
      );
    }

    // Regla de Vigencia 90 días
    if (new Date() > new Date(cupon.fechaVencimiento)) {
      return NextResponse.json(
        { success: false, error: `La cuponera ${cupon.codigo} se encuentra vencida desde el ${new Date(cupon.fechaVencimiento).toLocaleDateString('es-CL')}.` },
        { status: 400 }
      );
    }

    // Si se especificó un tramo, verificar que esté dentro de los tramosPermitidos por el contrato del cupón
    if (tramo && !cupon.tramosPermitidos.includes(tramo)) {
      return NextResponse.json(
        {
          success: false,
          error: `Restricción de Contrato: La cuponera ${cupon.codigo} solo es válida para los tramos (${cupon.tramosPermitidos.join(', ')}). El tramo seleccionado (${tramo}) no corresponde a la cuponera adquirida.`
        },
        { status: 400 }
      );
    }

    const targetTramo = tramo || cupon.tramosPermitidos[0];
    const targetFecha = fecha;

    // Buscar si existen salidas para este tramo y fecha
    let serviciosFiltrados = servicios.filter((s) => s.tramo === targetTramo && s.fecha === targetFecha);

    // Si no existen salidas en la base de datos de ejemplo para este tramo/fecha, las generamos dinámicamente y las guardamos
    if (serviciosFiltrados.length === 0 && targetTramo) {
      const nuevosServicios = generateServicesForTramoAndDate(targetTramo, targetFecha);
      servicios = [...servicios, ...nuevosServicios];
      writeJsonFile('servicios.json', servicios);
      serviciosFiltrados = nuevosServicios;
    }

    return NextResponse.json({
      success: true,
      cuponValido: {
        codigo: cupon.codigo,
        nombreCuponera: cupon.nombreCuponera,
        tramosPermitidos: cupon.tramosPermitidos,
        fechaVencimiento: cupon.fechaVencimiento,
        totalCupones: cupon.totalCupones || 10,
        cuponesUsados: cupon.cuponesUsados || 0,
        saldoDisponible: saldoActual
      },
      servicios: serviciosFiltrados
    });
  }

  // Búsqueda libre sin cupón previo
  let resultado = servicios;
  if (tramo) {
    resultado = resultado.filter((s) => s.tramo.toLowerCase().includes(tramo.toLowerCase()));
  }
  if (fecha) {
    resultado = resultado.filter((s) => s.fecha === fecha);
  }

  // Si búsqueda libre no da resultados, generamos salidas dinámicas para el tramo y fecha
  if (resultado.length === 0 && tramo) {
    const nuevosServicios = generateServicesForTramoAndDate(tramo, fecha);
    servicios = [...servicios, ...nuevosServicios];
    writeJsonFile('servicios.json', servicios);
    resultado = nuevosServicios;
  }

  return NextResponse.json({ success: true, servicios: resultado });
}
