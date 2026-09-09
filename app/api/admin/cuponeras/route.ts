import { NextResponse } from 'next/server';
import {
  readJsonFile,
  writeJsonFile,
  INITIAL_CUPONERAS,
  Cuponera,
  AuditoriaLog
} from '@/lib/dataStore';

// GET: Obtener todas las cuponeras (activas e inactivas) y logs de auditoría
export async function GET() {
  const cuponeras = readJsonFile<Cuponera[]>('cuponeras.json', INITIAL_CUPONERAS);
  const logs = readJsonFile<AuditoriaLog[]>('auditoria.json', []);

  return NextResponse.json({
    success: true,
    cuponeras,
    auditoria: logs.slice(-50).reverse() // Últimos 50 logs en orden cronológico inverso
  });
}

// POST: Crear o Editar una Cuponera (Sección 15)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      nombre,
      descripcion,
      tramos,
      valorUnitario,
      cantidadCupones,
      categoria,
      activa
    } = body;

    if (!nombre || !tramos || !valorUnitario || !cantidadCupones) {
      return NextResponse.json(
        { success: false, error: 'Complete los campos obligatorios del mantenedor.' },
        { status: 400 }
      );
    }

    const cuponeras = readJsonFile<Cuponera[]>('cuponeras.json', INITIAL_CUPONERAS);
    const tramosArray = Array.isArray(tramos)
      ? tramos
      : tramos.split(',').map((t: string) => t.trim()).filter(Boolean);

    const valorUniNum = Number(valorUnitario);
    const cantidadNum = Number(cantidadCupones);
    const precioTotalCalc = valorUniNum * cantidadNum;

    let logAccion: 'CREACION_CUPONERA' | 'EDICION_CUPONERA' = 'CREACION_CUPONERA';
    let cuponeraEditada: Cuponera;

    if (id) {
      // Modo Edición
      const index = cuponeras.findIndex((c) => c.id === Number(id));
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Cuponera no encontrada.' }, { status: 404 });
      }

      logAccion = 'EDICION_CUPONERA';
      cuponeraEditada = {
        ...cuponeras[index],
        nombre,
        descripcion: descripcion || cuponeras[index].descripcion,
        tramos: tramosArray,
        valorUnitario: valorUniNum,
        cantidadCupones: cantidadNum,
        precioTotal: precioTotalCalc,
        categoria: categoria || cuponeras[index].categoria,
        activa: activa !== undefined ? Boolean(activa) : cuponeras[index].activa
      };
      cuponeras[index] = cuponeraEditada;
    } else {
      // Modo Creación
      const newId = Math.max(...cuponeras.map((c) => c.id), 0) + 1;
      cuponeraEditada = {
        id: newId,
        nombre,
        descripcion: descripcion || 'Cuponera oficial Pullman Costa Central',
        tramos: tramosArray,
        valorUnitario: valorUniNum,
        cantidadCupones: cantidadNum,
        precioTotal: precioTotalCalc,
        activa: activa !== undefined ? Boolean(activa) : true,
        categoria: categoria || 'General',
        badge: 'Nueva'
      };
      cuponeras.push(cuponeraEditada);
    }

    writeJsonFile('cuponeras.json', cuponeras);

    // Auditoría
    const logs = readJsonFile<AuditoriaLog[]>('auditoria.json', []);
    logs.push({
      id: `LOG-ADM-${Date.now()}`,
      fechaHora: new Date().toISOString(),
      nombreUsuario: 'Administrador Mantenedor',
      accion: logAccion,
      detalles: `${logAccion === 'CREACION_CUPONERA' ? 'Creación' : 'Edición'} de cuponera: "${nombre}" (ID: ${cuponeraEditada.id}, Valor Total: $${precioTotalCalc.toLocaleString('es-CL')}, Estado: ${cuponeraEditada.activa ? 'Activa' : 'Inactiva'}).`
    });
    writeJsonFile('auditoria.json', logs);

    return NextResponse.json({
      success: true,
      mensaje: `Cuponera ${logAccion === 'CREACION_CUPONERA' ? 'creada' : 'actualizada'} exitosamente.`,
      cuponera: cuponeraEditada
    });

  } catch (error) {
    console.error('Error en POST /api/admin/cuponeras:', error);
    return NextResponse.json({ success: false, error: 'Error procesando mantenedor de cuponeras.' }, { status: 500 });
  }
}
