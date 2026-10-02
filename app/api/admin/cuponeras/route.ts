import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api';

async function getAdminToken() {
  const loginRes = await fetch(`${BACKEND_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'pullman2026' })
  });
  const data = await loginRes.json();
  return data.token;
}

export async function GET() {
  try {
    const token = await getAdminToken();
    const catalogRes = await fetch(`${BACKEND_URL}/admin/cuponeras`, { 
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store' 
    });
    const catalogData = await catalogRes.json();
    
    const auditRes = await fetch(`${BACKEND_URL}/admin/audit-logs`, { cache: 'no-store' });
    const auditData = await auditRes.json();

    const mappedCuponeras = (catalogData.success ? catalogData.data : []).map((c: any) => {
      const tramos = c.RutaServicios?.map((r: any) => `${r.origen}-${r.destino}`) || [];
      return {
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        precioTotal: c.precio_actual,
        cantidadCupones: c.maximo_usos,
        valorUnitario: Math.round(c.precio_actual / c.maximo_usos),
        tramos,
        activa: c.activa,
        categoria: c.categoria,
        badge: c.badge
      };
    });

    return NextResponse.json({
      success: true,
      cuponeras: mappedCuponeras,
      auditoria: auditData.success ? auditData.data : []
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

    const token = await getAdminToken();

    const parsedTramos = typeof tramos === 'string' 
      ? tramos.split(',').map(t => t.trim()).filter(t => t) 
      : tramos;

    const maximo_usos = Number(cantidadCupones) || 1;
    const precio_actual = (Number(valorUnitario) || 0) * maximo_usos;

    const payload: any = {
      nombre,
      descripcion,
      tipo: 'ESTANDAR',
      maximo_usos,
      precio_actual,
      activa,
      categoria: categoria || 'Todos',
      badge: badge || undefined
    };

    const rutas = parsedTramos.map((t: string) => {
      const parts = t.split('-');
      return { origen: parts[0]?.trim() || '', destino: parts[1]?.trim() || '' };
    });
    payload.rutas = rutas;

    let res;
    if (id) {
      // Editar
      res = await fetch(`${BACKEND_URL}/admin/cuponeras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } else {
      // Crear
      res = await fetch(`${BACKEND_URL}/admin/cuponeras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ success: false, error: data.message || data.error?.message || 'Error en backend' }, { status: 400 });
    }

    return NextResponse.json({ success: true, mensaje: 'Cuponera guardada exitosamente en la base de datos' });
  } catch (error) {
    console.error('Error saving cuponera:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }
    const token = await getAdminToken();
    const res = await fetch(`${BACKEND_URL}/admin/cuponeras/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) {
      return NextResponse.json({ success: false, error: data.message || 'Error al eliminar' }, { status: 400 });
    }
    return NextResponse.json({ success: true, mensaje: 'Cuponera eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting cuponera:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
