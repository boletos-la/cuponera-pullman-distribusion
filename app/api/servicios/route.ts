import { NextResponse } from 'next/server';
import { readJsonFile, INITIAL_SERVICIOS, Servicio, Cupon } from '@/lib/dataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tramo = searchParams.get('tramo');
  const fecha = searchParams.get('fecha');
  const cuponCodigo = searchParams.get('cuponCodigo');

  const servicios = readJsonFile<Servicio[]>('servicios.json', INITIAL_SERVICIOS);

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

    // Filtrar servicios compatibles con los tramos autorizados del cupón
    let serviciosFiltrados = servicios.filter((s) => cupon.tramosPermitidos.includes(s.tramo));

    if (tramo) {
      serviciosFiltrados = serviciosFiltrados.filter((s) => s.tramo === tramo);
    }

    if (fecha) {
      serviciosFiltrados = serviciosFiltrados.filter((s) => s.fecha === fecha);
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

  return NextResponse.json({ success: true, servicios: resultado });
}
