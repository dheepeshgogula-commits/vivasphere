import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';
import { VivaAIEngine } from '@/lib/gemini';
import { DifficultyLevel, QuestionMode, InterviewSession } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic = 'Operating Systems',
      difficulty = 'Intermediate',
      totalQuestions = 5,
      questionMode = 'MIXED',
      studyMode = false,
      syllabusExcerpt = '',
      userName = 'Alex Rivera (CS22B048)',
      userEmail = 'alex.rivera@cs.university.edu',
      userId = 'usr-alex'
    } = body;

    const diff = (difficulty as DifficultyLevel) || 'Intermediate';
    const qMode = (questionMode as QuestionMode) || 'MIXED';
    const qCount = Math.min(10, Math.max(2, Number(totalQuestions) || 5));

    // Get or create user
    const user = Storage.getUser(userId) || Storage.getUserByEmail(userEmail) || Storage.saveUser({
      id: userId || `usr-${Date.now()}`,
      name: userName,
      email: userEmail,
      createdAt: new Date().toISOString()
    });

    // Generate questions (MCQs + Written) or reuse provided questions (e.g. for retake weak questions)
    const generatedQuestions = (Array.isArray(body.customQuestions) && body.customQuestions.length > 0)
      ? body.customQuestions
      : await VivaAIEngine.generateQuestions(
          topic,
          diff,
          qCount,
          qMode,
          syllabusExcerpt
        );

    const actualCount = generatedQuestions.length;
    const sessionId = `viva-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSession: InterviewSession = {
      id: sessionId,
      userId: user.id,
      userName: user.rollNumber ? `${user.name} (${user.rollNumber})` : user.name,
      topic,
      syllabusExcerpt,
      questionMode: qMode,
      studyMode: Boolean(studyMode),
      initialDifficulty: diff,
      currentDifficulty: diff,
      totalQuestions: actualCount,
      status: 'ACTIVE',
      currentQuestionIndex: 0,
      questions: generatedQuestions,
      userAnswers: [],
      evaluations: [],
      proctorLogs: [],
      integrityScore: 100,
      finalScore: 0,
      correctCount: 0,
      incorrectCount: 0,
      rubricScores: {
        conceptualClarity: 0,
        technicalDepth: 0,
        terminologyAccuracy: 0,
        practicalApplication: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    Storage.saveSession(newSession);

    return NextResponse.json({ success: true, session: newSession });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create viva session' },
      { status: 500 }
    );
  }
}
