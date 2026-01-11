import { NextResponse } from 'next/server';
import { getNetworkSettings } from '@/lib/settings';

export const revalidate = 30;

export async function GET() {
  const settings = await getNetworkSettings();
  return NextResponse.json(settings, {
    headers: {
      'cache-control': 'public, max-age=30'
    }
  });
}
