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

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/config`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getAdminToken();
    const contentType = req.headers.get('content-type') || '';
    
    let res;
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      res = await fetch(`${BACKEND_URL}/admin/config`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    } else {
      const body = await req.json();
      res = await fetch(`${BACKEND_URL}/admin/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
