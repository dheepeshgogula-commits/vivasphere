import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';
import { VivaAIEngine } from '@/lib/gemini';

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

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Session is already ${session.status}` },
        { status: 400 }
      );
    }

    const { answer = '', selectedOptionIndex } = await req.json();
    const currentQIndex = session.currentQuestionIndex;
    const currentQuestion = session.questions[currentQIndex];

    if (!currentQuestion) {
      return NextResponse.json(
        { success: false, error: 'No active question found' },
        { status: 400 }
      );
    }

    // Evaluate answer (MCQ option or Written response)
    const evaluation = await VivaAIEngine.evaluateAnswer(
      session.topic,
      currentQuestion,
      answer,
      selectedOptionIndex
    );

    session.userAnswers.push(evaluation.userAnswer);
    session.evaluations.push(evaluation);
    session.currentDifficulty = evaluation.nextDifficulty;

    const isLastQuestion = currentQIndex + 1 >= session.totalQuestions;

    if (isLastQuestion) {
      // Finalize session with correct / incorrect count and feedback
      const { finalScore, correctCount, incorrectCount, rubricScores, overallFeedback } = VivaAIEngine.generateOverallFeedback(
        session.topic,
        session.evaluations,
        session.integrityScore,
        false
      );

      session.status = 'COMPLETED';
      session.finalScore = finalScore;
      session.correctCount = correctCount;
      session.incorrectCount = incorrectCount;
      session.rubricScores = rubricScores;
      session.overallFeedback = overallFeedback;
      session.completedAt = new Date().toISOString();
    } else {
      session.currentQuestionIndex = currentQIndex + 1;
      // Adjust next question difficulty
      if (session.questions[session.currentQuestionIndex]) {
        session.questions[session.currentQuestionIndex].difficulty = evaluation.nextDifficulty;
      }
    }

    Storage.saveSession(session);

    return NextResponse.json({
      success: true,
      evaluation,
      isCompleted: isLastQuestion,
      session
    });
  } catch (error) {
    console.error('Error in answer evaluation route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal evaluation error' },
      { status: 500 }
    );
  }
}
