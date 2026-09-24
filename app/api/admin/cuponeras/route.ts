import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, Cuponera, AuditoriaLog, INITIAL_CUPONERAS } from '@/lib/dataStore';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api';

/**
 * Consulta los logs de auditoría y trazabilidad centralizados en el backend
 */
async function fetchBackendAuditLogs(): Promise<AuditoriaLog[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/audit-logs`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (error) {
    // Si el backend aún no tiene el endpoint desplegado en dev-wit, continúa con la caché local
  }
  return [];
}

export async function GET() {
  try {
    const cuponeras = readJsonFile<Cuponera[]>('cuponeras.json', INITIAL_CUPONERAS);
    const fileLogs = readJsonFile<AuditoriaLog[]>('auditoria.json', []);

    // Consultar logs del backend centralizado
    const backendLogs = await fetchBackendAuditLogs();

    // Combinar logs del backend con logs locales del mantenedor sin duplicados
    const backendIds = new Set(backendLogs.map(l => l.id));
    const localOnlyLogs = fileLogs.filter(l => !backendIds.has(l.id));
    const mergedAuditoria = [...backendLogs, ...localOnlyLogs].sort(
      (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
    );

    // Persistir copia local en auditoria.json si hubo respuesta remota
    if (backendLogs.length > 0) {
      writeJsonFile('auditoria.json', mergedAuditoria);
    }

    return NextResponse.json({
      success: true,
      cuponeras,
      auditoria: mergedAuditoria
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, descripcion, tramos, valorUnitario, cantidadCupones, categoria, activa, badge } = body;

    const cuponeras = readJsonFile<Cuponera[]>('cuponeras.json', INITIAL_CUPONERAS);
    const auditoria = readJsonFile<AuditoriaLog[]>('auditoria.json', []);

    // Procesar tramos (separados por coma)
    const parsedTramos = typeof tramos === 'string' 
      ? tramos.split(',').map(t => t.trim()).filter(t => t) 
      : tramos;

    const precioTotal = valorUnitario * cantidadCupones;

    if (id) {
      // Editar existente
      const index = cuponeras.findIndex(c => c.id === id);
      if (index !== -1) {
        cuponeras[index] = {
          ...cuponeras[index],
          nombre,
          descripcion,
          tramos: parsedTramos,
          valorUnitario,
          cantidadCupones,
          precioTotal,
          categoria,
          activa,
          badge
        };

        // Agregar log de auditoría
        auditoria.unshift({
          id: `AUD-ADMIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fechaHora: new Date().toISOString(),
          accion: 'EDICION_CUPONERA',
          detalles: `Se editó la cuponera #${id} (${nombre}). Precio unitario: $${valorUnitario.toLocaleString('es-CL')}, Cupones: ${cantidadCupones}, Estado: ${activa ? 'Activa' : 'Inactiva'}.`,
          nombreUsuario: 'Admin'
        });
      } else {
        return NextResponse.json({ success: false, error: 'Cuponera no encontrada' }, { status: 404 });
      }
    } else {
      // Crear nueva
      const newId = cuponeras.length > 0 ? Math.max(...cuponeras.map(c => c.id)) + 1 : 1;
      const newCuponera: Cuponera = {
        id: newId,
        nombre,
        descripcion,
        tramos: parsedTramos,
        valorUnitario,
        cantidadCupones,
        precioTotal,
        categoria,
        activa,
        badge
      };
      cuponeras.push(newCuponera);

      // Agregar log de auditoría
      auditoria.unshift({
        id: `AUD-ADMIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fechaHora: new Date().toISOString(),
        accion: 'CREACION_CUPONERA',
        detalles: `Se creó la cuponera #${newId} (${nombre}) con ${cantidadCupones} cupones a $${valorUnitario.toLocaleString('es-CL')} c/u.`,
        nombreUsuario: 'Admin'
      });
    }

    writeJsonFile('cuponeras.json', cuponeras);
    writeJsonFile('auditoria.json', auditoria);

    return NextResponse.json({ success: true, mensaje: 'Cuponera guardada exitosamente' });
  } catch (error) {
    console.error('Error saving cuponera:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
