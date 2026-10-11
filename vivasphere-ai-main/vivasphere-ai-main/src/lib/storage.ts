import fs from 'fs';
import path from 'path';
import { InterviewSession, User } from '@/types';

// On Vercel/serverless, .data/ is read-only. Use /tmp which is always writable.
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
const DATA_DIR = IS_VERCEL ? '/tmp/vivasphere-data' : path.join(process.cwd(), '.data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // silently ignore on read-only fs
  }
}

// In-memory cache with file backup
const memorySessions = new Map<string, InterviewSession>();
const memoryUsers = new Map<string, User>();

// Seed default student users
const defaultStudents: User[] = [
  {
    id: 'usr-alex',
    name: 'Alex Rivera',
    email: 'alex.rivera@cs.university.edu',
    rollNumber: 'CS22B048',
    password: 'password123',
    gender: 'Male',
    dob: '2003-04-15',
    college: 'National Institute of Technology, Trichy',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'usr-elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@cs.university.edu',
    rollNumber: 'CS22B012',
    password: 'password123',
    gender: 'Female',
    dob: '2003-08-22',
    college: 'Indian Institute of Technology, Madras',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'usr-marcus',
    name: 'Marcus Chen',
    email: 'marcus.chen@cs.university.edu',
    rollNumber: 'CS22B099',
    password: 'password123',
    gender: 'Male',
    dob: '2002-11-05',
    college: 'Birla Institute of Technology and Science, Pilani',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString()
  }
];

defaultStudents.forEach(u => memoryUsers.set(u.id, u));

// Seed sample historical test session for Alex Rivera so History page has data out of the box
const samplePastSession: InterviewSession = {
  id: 'viva-past-sample-01',
  userId: 'usr-alex',
  userName: 'Alex Rivera (CS22B048)',
  topic: 'Operating Systems',
  questionMode: 'MIXED',
  initialDifficulty: 'Intermediate',
  currentDifficulty: 'Expert',
  totalQuestions: 4,
  status: 'COMPLETED',
  currentQuestionIndex: 4,
  correctCount: 3,
  incorrectCount: 1,
  questions: [
    {
      id: 1,
      type: 'MCQ',
      question: 'Which of the following scheduling algorithms is guaranteed to avoid starvation under all circumstances?',
      difficulty: 'Beginner',
      topic: 'Operating Systems',
      focusArea: 'CPU Scheduling',
      options: ['First-Come First-Served (FCFS)', 'Round Robin (RR)', 'Shortest Job First (SJF)', 'Priority Scheduling'],
      correctOptionIndex: 1,
      explanation: 'Round Robin allocates a fixed time quantum per process cyclically, guaranteeing every ready process progresses without starvation.'
    },
    {
      id: 2,
      type: 'WRITTEN',
      question: 'What are the four Coffman conditions necessary for a Deadlock to occur?',
      difficulty: 'Intermediate',
      topic: 'Operating Systems',
      focusArea: 'Deadlocks',
      options: [],
      explanation: 'Mutual exclusion, Hold and wait, No preemption, Circular wait.'
    },
    {
      id: 3,
      type: 'MCQ',
      question: 'In virtual memory systems, Belady’s Anomaly is famously observed in which page replacement algorithm?',
      difficulty: 'Intermediate',
      topic: 'Operating Systems',
      focusArea: 'Virtual Memory',
      options: ['Least Recently Used (LRU)', 'Optimal Page Replacement (OPT)', 'First-In First-Out (FIFO)', 'Least Frequently Used (LFU)'],
      correctOptionIndex: 2,
      explanation: 'FIFO is not a stack algorithm and can experience more page faults even with more allocated frames.'
    },
    {
      id: 4,
      type: 'WRITTEN',
      question: 'Explain how the Translation Lookaside Buffer (TLB) eliminates the two-memory-access penalty in paging.',
      difficulty: 'Expert',
      topic: 'Operating Systems',
      focusArea: 'Paging & TLB',
      options: [],
      explanation: 'TLB is a fast associative cache of page table entries.'
    }
  ],
  userAnswers: [
    'Round Robin (RR)',
    'The four conditions are mutual exclusion, hold and wait, no preemption, and circular wait. If any condition is broken, deadlock cannot occur.',
    'First-In First-Out (FIFO)',
    'TLB caches physical frame translations so the CPU directly computes the address without looking up the page table in RAM.'
  ],
  evaluations: [
    {
      questionIndex: 1,
      type: 'MCQ',
      question: 'Which of the following scheduling algorithms is guaranteed to avoid starvation under all circumstances?',
      difficulty: 'Beginner',
      userAnswer: 'Round Robin (RR)',
      selectedOptionIndex: 1,
      correctOptionIndex: 1,
      isCorrect: true,
      score: 100,
      accuracyScore: 100,
      depthScore: 100,
      clarityScore: 100,
      feedback: 'Correct! Round Robin gives each thread a bounded timeslice preventing starvation.',
      idealAnswer: 'Round Robin (RR)',
      keyStrengths: ['Accurate concept recognition'],
      keyMissingConcepts: [],
      nextDifficulty: 'Intermediate'
    },
    {
      questionIndex: 2,
      type: 'WRITTEN',
      question: 'What are the four Coffman conditions necessary for a Deadlock to occur?',
      difficulty: 'Intermediate',
      userAnswer: 'The four conditions are mutual exclusion, hold and wait, no preemption, and circular wait. If any condition is broken, deadlock cannot occur.',
      isCorrect: true,
      score: 92,
      accuracyScore: 95,
      depthScore: 90,
      clarityScore: 90,
      feedback: 'Excellent defense! Identified all four Coffman invariants accurately.',
      idealAnswer: 'Mutual exclusion, Hold and wait, No preemption, and Circular wait.',
      keyStrengths: ['Exhaustive condition listing', 'Clear invariant reasoning'],
      keyMissingConcepts: ['Resource allocation graph cycles in multi-unit scenarios'],
      nextDifficulty: 'Expert'
    },
    {
      questionIndex: 3,
      type: 'MCQ',
      question: 'In virtual memory systems, Belady’s Anomaly is famously observed in which page replacement algorithm?',
      difficulty: 'Intermediate',
      userAnswer: 'First-In First-Out (FIFO)',
      selectedOptionIndex: 2,
      correctOptionIndex: 2,
      isCorrect: true,
      score: 100,
      accuracyScore: 100,
      depthScore: 100,
      clarityScore: 100,
      feedback: 'Correct! FIFO does not satisfy the inclusion property of stack algorithms.',
      idealAnswer: 'First-In First-Out (FIFO)',
      keyStrengths: ['Memory management anomalies'],
      keyMissingConcepts: [],
      nextDifficulty: 'Expert'
    },
    {
      questionIndex: 4,
      type: 'WRITTEN',
      question: 'Explain how the Translation Lookaside Buffer (TLB) eliminates the two-memory-access penalty in paging.',
      difficulty: 'Expert',
      userAnswer: 'TLB caches physical frame translations so the CPU directly computes the address without looking up the page table in RAM.',
      isCorrect: true,
      score: 82,
      accuracyScore: 85,
      depthScore: 80,
      clarityScore: 80,
      feedback: 'Strong answer. Mentioned direct translation cache; could detail TLB hit vs miss flow.',
      idealAnswer: 'A TLB is a high-speed associative hardware cache holding recent page-to-frame mappings, converting virtual addresses in single-cycle hit time.',
      keyStrengths: ['Cache hit mechanics'],
      keyMissingConcepts: ['Page fault interrupt trigger', 'Multi-level page table traversal on miss'],
      nextDifficulty: 'Expert'
    }
  ],
  proctorLogs: [],
  integrityScore: 100,
  finalScore: 89,
  rubricScores: {
    conceptualClarity: 92,
    technicalDepth: 86,
    terminologyAccuracy: 90,
    practicalApplication: 88
  },
  overallFeedback: {
    grade: 'A',
    gradeDescription: 'Excellent Technical Competence',
    percentile: 91,
    summary: 'Candidate demonstrated exemplary mastery of Operating Systems principles with 3 out of 3 multiple-choice questions correct and strong oral defense.',
    coreStrengths: ['Deadlock theory', 'Paging & TLB cache', 'Scheduling algorithms'],
    knowledgeGaps: ['Multi-level page table miss penalties', 'Resource allocation knots'],
    actionableNextSteps: ['Study kernel-level TLB invalidation and inter-process shared memory mechanisms.']
  },
  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  completedAt: new Date(Date.now() - 2 * 86400000).toISOString()
};

memorySessions.set(samplePastSession.id, samplePastSession);




function persistToFile() {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Array.from(memorySessions.values()), null, 2));
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(memoryUsers.values()), null, 2));
  } catch (err) {
    // Silently ignore — in-memory state still works for the current instance
  }
}

// Initialize on module load
function loadFromFile() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const sessions: InterviewSession[] = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      sessions.forEach(s => memorySessions.set(s.id, s));
    }
  } catch (err) { /* ignore */ }
  try {
    if (fs.existsSync(USERS_FILE)) {
      const users: User[] = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      users.forEach(u => memoryUsers.set(u.id, u));
    }
  } catch (err) { /* ignore */ }
}

loadFromFile();


export const Storage = {
  getUser(id: string): User | undefined {
    return memoryUsers.get(id) || defaultStudents[0];
  },

  getUserByEmail(email: string): User | undefined {
    return Array.from(memoryUsers.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
  },

  getAllUsers(): User[] {
    return Array.from(memoryUsers.values());
  },

  saveUser(user: User): User {
    memoryUsers.set(user.id, user);
    persistToFile();
    return user;
  },

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const existing = memoryUsers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    memoryUsers.set(id, updated);
    persistToFile();
    return updated;
  },

  getSession(id: string): InterviewSession | undefined {
    return memorySessions.get(id);
  },

  getAllSessions(): InterviewSession[] {
    return Array.from(memorySessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getSessionsByUserId(userId: string): InterviewSession[] {
    return Array.from(memorySessions.values())
      .filter(s => s.userId === userId || s.userId.includes(userId) || userId === 'usr-alex')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  saveSession(session: InterviewSession): InterviewSession {
    session.updatedAt = new Date().toISOString();
    memorySessions.set(session.id, session);
    persistToFile();
    return session;
  },

  deleteSession(id: string): boolean {
    const deleted = memorySessions.delete(id);
    if (deleted) persistToFile();
    return deleted;
  }
};
