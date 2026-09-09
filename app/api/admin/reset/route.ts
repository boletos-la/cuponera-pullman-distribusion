import { NextResponse } from 'next/server';
import { writeJsonFile, INITIAL_SERVICIOS, INITIAL_CUPONERAS, AuditoriaLog } from '@/lib/dataStore';

export async function POST() {
  try {
    // Resetear compras, cupones y pasajes a arrays vacíos
    writeJsonFile('compras.json', []);
    writeJsonFile('cupones.json', []);
    writeJsonFile('pasajes.json', []);

    // Restablecer catálogo de cuponeras y servicios con asientos limpios
    writeJsonFile('cuponeras.json', INITIAL_CUPONERAS);
    writeJsonFile('servicios.json', INITIAL_SERVICIOS);

    // Registrar log de reset
    const resetLog: AuditoriaLog[] = [
      {
        id: `LOG-RESET-${Date.now()}`,
        fechaHora: new Date().toISOString(),
        nombreUsuario: 'Administrador / Usuario',
        accion: 'CREACION_CUPONERA',
        detalles: 'Se realizó una limpieza completa de datos de prueba: compras, cupones emitidos y pasajes restablecidos.'
      }
    ];
    writeJsonFile('auditoria.json', resetLog);

    return NextResponse.json({
      success: true,
      mensaje: '¡Todos los datos de compras, cupones, pasajes e historial del usuario fueron borrados correctamente!'
    });
  } catch (error) {
    console.error('Error al resetear datos:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error al limpiar los datos.' },
      { status: 500 }
    );
  }
}
