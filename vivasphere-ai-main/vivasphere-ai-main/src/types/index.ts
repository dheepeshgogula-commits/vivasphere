export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Expert';
export type QuestionType = 'MCQ' | 'WRITTEN';
export type QuestionMode = 'MIXED' | 'MCQ_ONLY' | 'WRITTEN_ONLY';

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  password?: string;
  avatar?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dob?: string;
  college?: string;
  createdAt: string;
}

export interface QuestionItem {
  id: number;
  type: QuestionType;
  question: string;
  difficulty: DifficultyLevel;
  topic: string;
  focusArea: string;
  options?: string[]; // 4 options for MCQ
  correctOptionIndex?: number; // 0, 1, 2, 3
  explanation?: string;
  hintUsed?: boolean;
}

export interface QuestionEvaluation {
  questionIndex: number;
  type: QuestionType;
  question: string;
  difficulty: DifficultyLevel;
  userAnswer: string;
  selectedOptionIndex?: number;
  correctOptionIndex?: number;
  isCorrect: boolean;
  score: number; // 0 to 100
  accuracyScore: number;
  depthScore: number;
  clarityScore: number;
  feedback: string;
  idealAnswer: string;
  keyStrengths: string[];
  keyMissingConcepts: string[];
  nextDifficulty: DifficultyLevel;
  difficultyChangeReason?: string;
}

export interface ProctorEvent {
  id: string;
  type: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'PAGE_UNLOAD_ATTEMPT' | 'KEYBOARD_SHORTCUT_BLOCK' | 'FULLSCREEN_EXIT';
  timestamp: string;
  details: string;
  penaltyApplied: number;
}

export interface RubricScore {
  conceptualClarity: number; // 0-100
  technicalDepth: number; // 0-100
  terminologyAccuracy: number; // 0-100
  practicalApplication: number; // 0-100
}

export interface OverallFeedback {
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  gradeDescription: string;
  percentile: number;
  summary: string;
  coreStrengths: string[];
  knowledgeGaps: string[];
  actionableNextSteps: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  userName: string;
  topic: string;
  syllabusExcerpt?: string;
  questionMode: QuestionMode;
  initialDifficulty: DifficultyLevel;
  currentDifficulty: DifficultyLevel;
  totalQuestions: number;
  status: 'READY' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED_VIOLATION';
  terminatedReason?: string;
  currentQuestionIndex: number;
  questions: QuestionItem[];
  userAnswers: string[];
  evaluations: QuestionEvaluation[];
  proctorLogs: ProctorEvent[];
  integrityScore: number; // 0 to 100
  finalScore: number; // 0 to 100
  correctCount?: number;
  incorrectCount?: number;
  rubricScores: RubricScore;
  overallFeedback?: OverallFeedback;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  studyMode?: boolean;
}
