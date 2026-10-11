import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';
import { VivaAIEngine } from '@/lib/gemini';
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

    const { reason = 'ANTI_CHEAT_VIOLATION', details = 'Student switched tabs or window lost focus.' } = await req.json();

    const isViolation = reason === 'ANTI_CHEAT_VIOLATION';

    // Log the termination proctor event
    const terminationEvent: ProctorEvent = {
      id: `proc-term-${Date.now()}`,
      type: 'TAB_SWITCH',
      timestamp: new Date().toISOString(),
      details: isViolation ? `Critical Proctor Violation: ${details} (Automatic Disqualification)` : `Session ended: ${details}`,
      penaltyApplied: isViolation ? 40 : 0
    };

    session.proctorLogs.push(terminationEvent);
    session.integrityScore = Math.max(0, session.integrityScore - terminationEvent.penaltyApplied);

    // Compute feedback with violation penalty
    const { finalScore, rubricScores, overallFeedback } = VivaAIEngine.generateOverallFeedback(
      session.topic,
      session.evaluations,
      session.integrityScore,
      isViolation
    );

    session.status = isViolation ? 'TERMINATED_VIOLATION' : 'COMPLETED';
    session.terminatedReason = details;
    session.finalScore = finalScore;
    session.rubricScores = rubricScores;
    session.overallFeedback = overallFeedback;
    session.completedAt = new Date().toISOString();

    Storage.saveSession(session);

    return NextResponse.json({
      success: true,
      message: 'Session terminated and processed',
      session
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}
