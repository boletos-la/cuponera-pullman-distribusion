import { NextResponse } from 'next/server';
import {
  readJsonFile,
  writeJsonFile,
  Pasaje,
  Cupon,
  Servicio,
  AuditoriaLog
} from '@/lib/dataStore';
import { cleanRut, validateRut } from '@/lib/rutValidator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pasajeCodigo, rut } = body;

    if (!pasajeCodigo || !rut) {
      return NextResponse.json(
        { success: false, error: 'Debe ingresar el código de pasaje (ej: TKT-XXXXX) y su RUT.' },
        { status: 400 }
      );
    }

    const rutLimpio = cleanRut(rut);
    if (!validateRut(rutLimpio)) {
      return NextResponse.json({ success: false, error: 'El RUT ingresado no es válido.' }, { status: 400 });
    }

    // 1. Buscar pasaje
    const pasajes = readJsonFile<Pasaje[]>('pasajes.json', []);
    const pasajeIndex = pasajes.findIndex(
      (p) => p.codigo.trim().toUpperCase() === pasajeCodigo.trim().toUpperCase() && p.rutCliente === rutLimpio
    );

    if (pasajeIndex === -1) {
      return NextResponse.json(
        { success: false, error: `No se encontró un pasaje con el código ${pasajeCodigo} asociado al RUT ingresado.` },
        { status: 404 }
      );
    }

    const pasaje = pasajes[pasajeIndex];

    if (pasaje.estado === 'Anulado') {
      return NextResponse.json(
        { success: false, error: `El pasaje ${pasaje.codigo} ya fue anulado previamente.` },
        { status: 400 }
      );
    }

    // 2. REGLA LEGAL DE 4 HORAS PREVIAS
    // Combinar fechaSalida y horaSalida para calcular horas restantes
    const [year, month, day] = pasaje.fechaSalida.split('-').map(Number);
    const [hour, minute] = pasaje.horaSalida.split(':').map(Number);
    const salidaDateTime = new Date(year, month - 1, day, hour, minute);

    const ahora = new Date();
    const diffMs = salidaDateTime.getTime() - ahora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras < 4) {
      const horasFormateadas = diffHoras > 0 ? diffHoras.toFixed(1) : '0';
      return NextResponse.json(
        {
          success: false,
          error: `RESTRICCIÓN LEGAL DE TRANSPORTE: Faltan ${horasFormateadas} horas para la salida del bus. Según la normativa legal vigente, la anulación de pasajes solo está permitida con un mínimo de 4 horas de anticipación a la salida.`
        },
        { status: 400 }
      );
    }

    // 3. Proceder con Anulación
    // A. Marcar Pasaje como Anulado
    pasajes[pasajeIndex].estado = 'Anulado';
    writeJsonFile('pasajes.json', pasajes);

    // B. Reintegrar 1 cupón al saldo de la Cuponera
    const cupones = readJsonFile<Cupon[]>('cupones.json', []);
    const cuponIndex = cupones.findIndex((c) => c.codigo === pasaje.cuponCodigo);

    let cuponReintegradoCodigo = pasaje.cuponCodigo;
    if (cuponIndex !== -1) {
      const c = cupones[cuponIndex];
      const nuevosUsados = Math.max(0, (c.cuponesUsados || 1) - 1);
      const nuevoSaldo = Math.min(c.totalCupones || 10, (c.saldoDisponible || 0) + 1);

      cupones[cuponIndex] = {
        ...c,
        cuponesUsados: nuevosUsados,
        saldoDisponible: nuevoSaldo,
        estado: 'Activo',
        fechaUso: null,
        pasajeCodigo: null
      };
      writeJsonFile('cupones.json', cupones);
    }

    // C. Liberar el Asiento del Bus
    const servicios = readJsonFile<Servicio[]>('servicios.json', []);
    const servicioIndex = servicios.findIndex((s) => s.id === pasaje.servicioId);

    if (servicioIndex !== -1) {
      servicios[servicioIndex].asientos = servicios[servicioIndex].asientos.map((a) => {
        if (a.numero === pasaje.asientoNumero) {
          return { ...a, estado: 'Disponible', pasajeCodigo: null };
        }
        return a;
      });
      writeJsonFile('servicios.json', servicios);
    }

    // D. Registrar Log de Auditoría
    const logs = readJsonFile<AuditoriaLog[]>('auditoria.json', []);
    logs.push({
      id: `LOG-ANUL-${Date.now()}`,
      fechaHora: new Date().toISOString(),
      rutUsuario: rutLimpio,
      accion: 'ANULACION_PASAJE',
      detalles: `Anulación de pasaje ${pasaje.codigo} efectuada con anticipación de ${diffHoras.toFixed(1)} horas. El cupón ${cuponReintegradoCodigo} se reintegró como Activo y se liberó el asiento N°${pasaje.asientoNumero}.`
    });
    writeJsonFile('auditoria.json', logs);

    return NextResponse.json({
      success: true,
      mensaje: `Pasaje ${pasaje.codigo} anulado exitosamente. El cupón ${cuponReintegradoCodigo} fue reintegrado a su saldo disponible.`,
      cuponCodigoReintegrado: cuponReintegradoCodigo
    });

  } catch (error) {
    console.error('Error en POST /api/cupones/cancelar:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al procesar la anulación.' },
      { status: 500 }
    );
  }
}
