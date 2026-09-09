import { NextResponse } from 'next/server';
import {
  readJsonFile,
  writeJsonFile,
  checkAndUpdateExpiredCoupons,
  Cupon
} from '@/lib/dataStore';
import { cleanRut, validateRut, formatRut } from '@/lib/rutValidator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rutParam = searchParams.get('rut');

  // Ejecuta la actualización automática de cupones expirados (>90 días)
  checkAndUpdateExpiredCoupons();

  const allCupones = readJsonFile<Cupon[]>('cupones.json', []);

  if (!rutParam) {
    return NextResponse.json({ success: true, data: allCupones });
  }

  const cleanedRut = cleanRut(rutParam);
  if (!validateRut(cleanedRut)) {
    return NextResponse.json(
      { success: false, error: 'El RUT ingresado no es válido.' },
      { status: 400 }
    );
  }

  const userCupones = allCupones.filter((c) => c.rutCliente === cleanedRut);

  // Cálculo consolidado de métricas
  let disponibles = 0;
  let utilizados = 0;
  let vencidos = 0;
  let total = 0;

  userCupones.forEach((c) => {
    const totalC = c.totalCupones || 1;
    const usadosC = c.cuponesUsados || 0;
    const saldoC = c.saldoDisponible !== undefined ? c.saldoDisponible : (c.estado === 'Activo' ? 1 : 0);

    disponibles += saldoC;
    utilizados += usadosC;
    if (c.estado === 'Vencido') {
      vencidos += totalC;
    }
    total += totalC;
  });

  return NextResponse.json({
    success: true,
    rutFormateado: formatRut(cleanedRut),
    metricas: {
      disponibles,
      utilizados,
      vencidos,
      total
    },
    cupones: userCupones
  });
}

// Permite actualizar el correo electrónico de notificación para el cliente
export async function PUT(request: Request) {
  try {
    const { rut, nuevoEmail } = await request.json();
    if (!rut || !nuevoEmail) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    const cleanedRut = cleanRut(rut);
    const cupones = readJsonFile<Cupon[]>('cupones.json', []);

    let actualizados = 0;
    const cuponesActualizados = cupones.map((c) => {
      if (c.rutCliente === cleanedRut) {
        actualizados++;
        return { ...c, emailCliente: nuevoEmail };
      }
      return c;
    });

    writeJsonFile('cupones.json', cuponesActualizados);

    return NextResponse.json({
      success: true,
      mensaje: `Se actualizó el correo para ${actualizados} cupones del usuario.`,
      email: nuevoEmail
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error actualizando email.' }, { status: 500 });
  }
}
