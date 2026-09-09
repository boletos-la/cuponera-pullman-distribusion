import { NextResponse } from 'next/server';
import {
  readJsonFile,
  writeJsonFile,
  Cupon,
  Servicio,
  Pasaje,
  AuditoriaLog
} from '@/lib/dataStore';
import { validateRut, cleanRut } from '@/lib/rutValidator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cuponCodigo,
      servicioId,
      asientoNumero,
      rutCliente,
      nombreCliente,
      emailCliente,
      otpTokenValido = false
    } = body;

    // ----------------- CRITERIO 8: VALIDACIÓN 2FA PREVIA (REQUERIMIENTO CRÍTICO) -----------------
    if (!otpTokenValido) {
      return NextResponse.json(
        {
          success: false,
          error: 'REQUERIMIENTO DE SEGURIDAD 2FA: El canje y emisión del pasaje fue BLOQUEADO porque no se completó la validación del código 2FA. El cupón NO ha sido descontado.'
        },
        { status: 403 }
      );
    }

    if (!cuponCodigo || !servicioId || !asientoNumero || !rutCliente) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros obligatorios para efectuar la reserva.' },
        { status: 400 }
      );
    }

    const rutLimpio = cleanRut(rutCliente);
    if (!validateRut(rutLimpio)) {
      return NextResponse.json({ success: false, error: 'RUT inválido.' }, { status: 400 });
    }

    // ----------------- CRITERIO 1: EXISTENCIA DEL CUPÓN -----------------
    const cupones = readJsonFile<Cupon[]>('cupones.json', []);
    const cuponIndex = cupones.findIndex((c) => c.codigo === cuponCodigo && c.rutCliente === rutLimpio);

    if (cuponIndex === -1) {
      return NextResponse.json(
        { success: false, error: `El cupón ${cuponCodigo} no existe o no pertenece al RUT ${rutCliente}.` },
        { status: 404 }
      );
    }

    const cupon = cupones[cuponIndex];

    // ----------------- CRITERIO 2: ESTADO Y SALDO DEL CUPÓN -----------------
    const saldoActual = cupon.saldoDisponible !== undefined ? cupon.saldoDisponible : (cupon.estado === 'Activo' ? 1 : 0);

    if (cupon.estado !== 'Activo' || saldoActual <= 0) {
      return NextResponse.json(
        { success: false, error: `La cuponera ${cupon.codigo} no tiene saldo disponible (${saldoActual}/${cupon.totalCupones || 10} cupones) o no está activa.` },
        { status: 400 }
      );
    }

    // ----------------- CRITERIO 3: VIGENCIA (90 DÍAS) -----------------
    if (new Date() > new Date(cupon.fechaVencimiento)) {
      cupones[cuponIndex].estado = 'Vencido';
      writeJsonFile('cupones.json', cupones);
      return NextResponse.json(
        { success: false, error: `El cupón se encuentra vencido. Superó los 90 días corridos de vigencia desde su adquisición.` },
        { status: 400 }
      );
    }

    // ----------------- CRITERIO 4 Y 5: RUTA Y SERVICIO RESTRINGIDO -----------------
    const servicios = readJsonFile<Servicio[]>('servicios.json', []);
    const servicioIndex = servicios.findIndex((s) => s.id === servicioId);

    if (servicioIndex === -1) {
      return NextResponse.json({ success: false, error: 'El servicio de bus seleccionado no existe.' }, { status: 404 });
    }

    const servicio = servicios[servicioIndex];

    if (!cupon.tramosPermitidos.includes(servicio.tramo)) {
      return NextResponse.json(
        {
          success: false,
          error: `Incompatibilidad de Ruta: El contrato del cupón (${cupon.tramosPermitidos.join(', ')}) no permite viajar en el tramo del servicio elegido (${servicio.tramo}).`
        },
        { status: 400 }
      );
    }

    // ----------------- CRITERIO 6 Y 7: DISPONIBILIDAD Y RESERVA DE ASIENTO -----------------
    const asientoIndex = servicio.asientos.findIndex((a) => a.numero === Number(asientoNumero));

    if (asientoIndex === -1) {
      return NextResponse.json({ success: false, error: 'El número de asiento no existe en el bus.' }, { status: 404 });
    }

    const asiento = servicio.asientos[asientoIndex];
    if (asiento.estado !== 'Disponible') {
      return NextResponse.json(
        { success: false, error: `El asiento N° ${asientoNumero} ya no está disponible (Estado: ${asiento.estado}). Por favor seleccione otro asiento.` },
        { status: 409 }
      );
    }

    // ----------------- CRITERIO 9: CONSUMO Y EMISIÓN SIMULTÁNEA DEL PASAJE -----------------
    const pasajeCodigo = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    const fechaEmision = new Date().toISOString();

    const nuevosUsados = (cupon.cuponesUsados || 0) + 1;
    const nuevoSaldo = Math.max(0, saldoActual - 1);
    const nuevoEstado = nuevoSaldo === 0 ? 'Agotado' : 'Activo';

    // A. Actualizar Saldo de Cuponera
    cupones[cuponIndex] = {
      ...cupon,
      cuponesUsados: nuevosUsados,
      saldoDisponible: nuevoSaldo,
      estado: nuevoEstado,
      fechaUso: fechaEmision,
      pasajeCodigo: pasajeCodigo
    };
    writeJsonFile('cupones.json', cupones);

    // B. Marcar Asiento como 'Ocupado'
    servicios[servicioIndex].asientos[asientoIndex] = {
      ...asiento,
      estado: 'Ocupado',
      pasajeCodigo: pasajeCodigo
    };
    writeJsonFile('servicios.json', servicios);

    // C. Generar Boleto Electrónico (TKT-XXXXX)
    const nuevoPasaje: Pasaje = {
      codigo: pasajeCodigo,
      cuponCodigo: cupon.codigo,
      rutCliente: rutLimpio,
      nombreCliente: nombreCliente || cupon.nombreCliente,
      emailCliente: emailCliente || cupon.emailCliente,
      servicioId: servicio.id,
      origen: servicio.origen,
      destino: servicio.destino,
      fechaSalida: servicio.fecha,
      horaSalida: servicio.horaSalida,
      asientoNumero: Number(asientoNumero),
      tipoBus: asiento.tipo,
      patente: servicio.patente,
      estado: 'Emitido',
      fechaEmision: fechaEmision,
      codigoQR: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${pasajeCodigo}-${rutLimpio}`,
      codigoBarras: `*${pasajeCodigo}*`
    };

    const pasajes = readJsonFile<Pasaje[]>('pasajes.json', []);
    pasajes.push(nuevoPasaje);
    writeJsonFile('pasajes.json', pasajes);

    // D. Registrar trazabilidad
    const logs = readJsonFile<AuditoriaLog[]>('auditoria.json', []);
    logs.push({
      id: `LOG-CANJE-${Date.now()}`,
      fechaHora: fechaEmision,
      rutUsuario: rutLimpio,
      accion: 'CANJE_CUPON',
      detalles: `Canje exitoso con 2FA del cupón ${cupon.codigo} por pasaje ${pasajeCodigo} (Asiento N°${asientoNumero}, Bus ${servicio.patente}, Tramo: ${servicio.tramo}).`
    });
    writeJsonFile('auditoria.json', logs);

    return NextResponse.json({
      success: true,
      mensaje: 'Canje de cupón y emisión de pasaje completados exitosamente.',
      pasaje: nuevoPasaje
    });

  } catch (error) {
    console.error('Error en POST /api/reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error inesperado al procesar la reserva y emisión.' },
      { status: 500 }
    );
  }
}
