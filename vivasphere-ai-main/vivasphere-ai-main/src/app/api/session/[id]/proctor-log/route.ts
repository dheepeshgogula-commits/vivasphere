import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';
import { ProctorEvent } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = Storage.getSession(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const { event }: { event: ProctorEvent } = await req.json();

    if (event) {
      session.proctorLogs.push(event);
      session.integrityScore = Math.max(0, session.integrityScore - (event.penaltyApplied || 5));
      Storage.saveSession(session);
    }

    return NextResponse.json({
      success: true,
      integrityScore: session.integrityScore,
      proctorLogsCount: session.proctorLogs.length
    });
  } catch (error) {
    console.error('Error recording proctor log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record proctor event' },
      { status: 500 }
    );
  }
}
