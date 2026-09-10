import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000';

  try {
    const res = await fetch(`${backendUrl}/health`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json(
      { status: 'error', code: res.status, message: 'Backend returned error status' },
      { status: res.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'backend_unreachable',
        error: err?.message || 'Could not connect to internal FastAPI backend on port 8000',
      },
      { status: 503 }
    );
  }
}
