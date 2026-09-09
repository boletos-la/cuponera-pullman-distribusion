import { NextResponse } from 'next/server';
import { readJsonFile, INITIAL_CUPONERAS, Cuponera } from '@/lib/dataStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get('all') === 'true';

  let cuponeras = readJsonFile<Cuponera[]>('cuponeras.json', INITIAL_CUPONERAS);

  if (!showAll) {
    cuponeras = cuponeras.filter((c) => c.activa);
  }

  return NextResponse.json({ success: true, data: cuponeras });
}
