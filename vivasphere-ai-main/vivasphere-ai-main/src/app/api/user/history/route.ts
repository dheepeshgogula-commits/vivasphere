import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-alex';

    const sessions = Storage.getSessionsByUserId(userId);

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (err) {
    console.error('Failed to get history:', err);
    return NextResponse.json({ success: false, error: 'Could not fetch session history' }, { status: 500 });
  }
}
