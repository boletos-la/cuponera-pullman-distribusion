import { NextResponse } from 'next/server';
import {
  readJsonFile,
  writeJsonFile,
  INITIAL_CUPONERAS,
  Cuponera,
  Compra,
  Cupon,
  AuditoriaLog
} from '@/lib/dataStore';
import { validateRut, cleanRut, formatRut } from '@/lib/rutValidator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      rutCliente,
      nombreCliente,
      emailCliente,
      telefonoCliente,
      cuponeraId,
      simularRechazo = false
    } = body;

    // 1. Validación de datos de entrada
    if (!rutCliente || !nombreCliente || !emailCliente || !cuponeraId) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos obligatorios deben ser completados.' },
        { status: 400 }
      );
    }

    // 2. Validación estricta de RUT (Módulo 11)
    if (!validateRut(rutCliente)) {
      return NextResponse.json(
        { success: false, error: 'El RUT ingresado no es válido según el algoritmo Módulo 11.' },
        { status: 400 }
      );
    }

    const rutLimpio = cleanRut(rutCliente);
    const rutFormateado = formatRut(rutCliente);

    // 3. Obtener Cuponera elegida
    const cuponeras = readJsonFile<Cuponera[]>('cuponeras.json', INITIAL_CUPONERAS);
    const cuponera = cuponeras.find((c) => c.id === Number(cuponeraId));

    if (!cuponera || !cuponera.activa) {
      return NextResponse.json(
        { success: false, error: 'La cuponera seleccionada no existe o no está disponible.' },
        { status: 404 }
      );
    }

    // 4. Simulación de Pasarela Webpay Plus (Excepción 1: Pago Rechazado)
    if (simularRechazo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transacción Rechazada por la pasarela de pago Webpay. Verifique los datos de su tarjeta e intente nuevamente.'
        },
        { status: 402 }
      );
    }

    // 5. Cálculo exacto de 90 días de vigencia (23:59:59 del día 90)
    const fechaCompraObj = new Date();
    const fechaVencimientoObj = new Date(fechaCompraObj);
    fechaVencimientoObj.setDate(fechaVencimientoObj.getDate() + 90);
    fechaVencimientoObj.setHours(23, 59, 59, 999);

    const compraId = `ORD-${Date.now().toString().slice(-6)}`;

    // 6. Registro de la Orden de Compra
    const nuevaCompra: Compra = {
      id: compraId,
      rutCliente: rutLimpio,
      nombreCliente,
      emailCliente,
      telefonoCliente: telefonoCliente || '',
      cuponeraId: cuponera.id,
      nombreCuponera: cuponera.nombre,
      cantidadCupones: cuponera.cantidadCupones,
      montoTotal: cuponera.precioTotal,
      metodoPago: 'Webpay Plus - Transbank',
      estadoPago: 'Aprobado',
      fechaCompra: fechaCompraObj.toISOString(),
      fechaVencimiento: fechaVencimientoObj.toISOString()
    };

    const compras = readJsonFile<Compra[]>('compras.json', []);
    compras.push(nuevaCompra);
    writeJsonFile('compras.json', compras);

    // 7. Generación de Cuponera Adquirida con Saldo (ej: 10/10 o 20/20 cupones)
    const cuponesExistentes = readJsonFile<Cupon[]>('cupones.json', []);
    
    // Prefijo corto según nombre de cuponera
    const prefijo = cuponera.nombre.includes('VIÑA') ? 'VNA' :
                    cuponera.nombre.includes('CONCON') ? 'CCN' :
                    cuponera.nombre.includes('VALPARAISO') ? 'VLP' :
                    cuponera.nombre.includes('LITORAL') ? 'LIT' : 'PCC';

    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigoCuponera = `CUP-${prefijo}-${randomCode}`;

    const nuevaCuponeraEmitida: Cupon = {
      codigo: codigoCuponera,
      compraId: compraId,
      cuponeraId: cuponera.id,
      rutCliente: rutLimpio,
      nombreCliente: nombreCliente,
      emailCliente: emailCliente,
      nombreCuponera: cuponera.nombre,
      tramosPermitidos: cuponera.tramos,
      valorUnitario: cuponera.valorUnitario,
      totalCupones: cuponera.cantidadCupones,
      cuponesUsados: 0,
      saldoDisponible: cuponera.cantidadCupones,
      estado: 'Activo',
      fechaCompra: fechaCompraObj.toISOString(),
      fechaVencimiento: fechaVencimientoObj.toISOString()
    };

    writeJsonFile('compras.json', compras);
    writeJsonFile('cupones.json', [...cuponesExistentes, nuevaCuponeraEmitida]);

    // 8. Trazabilidad y Auditoría
    const logs = readJsonFile<AuditoriaLog[]>('auditoria.json', []);
    logs.push({
      id: `LOG-${Date.now()}`,
      fechaHora: new Date().toISOString(),
      rutUsuario: rutLimpio,
      nombreUsuario: nombreCliente,
      accion: 'COMPRA_CUPONERA',
      detalles: `Compra aprobada: ${cuponera.nombre} (${cuponera.cantidadCupones} cupones) por $${cuponera.precioTotal.toLocaleString('es-CL')}. Orden: ${compraId}`
    });
    writeJsonFile('auditoria.json', logs);

    return NextResponse.json({
      success: true,
      data: {
        compra: nuevaCompra,
        rutFormateado,
        cuponesGenerados: [nuevaCuponeraEmitida]
      }
    });

  } catch (error) {
    console.error('Error en POST /api/compras:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error interno procesando la compra.' },
      { status: 500 }
    );
  }
}
