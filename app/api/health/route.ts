import { NextResponse } from 'next/server';

/** Health check used by Railway's deploy healthcheck (see railway.json). */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'shieldpay',
    network: process.env.STELLAR_NETWORK ?? 'testnet',
    timestamp: new Date().toISOString(),
  });
}
