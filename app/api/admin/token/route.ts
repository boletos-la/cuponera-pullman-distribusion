import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api';

export async function GET() {
  try {
    const loginRes = await fetch(`${BACKEND_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pullman2026' })
    });
    
    if (!loginRes.ok) {
      throw new Error('Failed to login to backend');
    }
    
    const data = await loginRes.json();
    return NextResponse.json({ success: true, token: data.token });
  } catch (error: any) {
    console.error('Error fetching admin token:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
