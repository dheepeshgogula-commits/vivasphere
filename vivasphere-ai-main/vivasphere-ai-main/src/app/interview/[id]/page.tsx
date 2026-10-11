'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Navbar from '@/components/Navbar';

import { 
  ShieldAlert, 
  ShieldCheck, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Clock, 
  Terminal, 
  CheckCircle2, 
  XCircle,
  Loader2, 
  Maximize2,
  BrainCircuit,
  Check,
  ListOrdered,
  Lightbulb,
  Flame,
  BookOpen,
  ChevronRight,
  Zap
} from 'lucide-react';
import { InterviewSession, QuestionItem, QuestionEvaluation, DifficultyLevel, ProctorEvent } from '@/types';

const TIME_LIMIT = 90; // seconds per question

function playWarningBeep() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const authorized = useAuthGuard();
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const isRedirectingRef = useRef(false);
  
  // Answering states
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  
  // Voice synthesis & recognition
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const recognitionRef = useRef<any>(null);

  // ── NEW: Timer ──
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittingRef = useRef(false);

  // ── NEW: Streak ──
  const [streak, setStreak] = useState(0);

  // ── NEW: Hint ──
  const [hintShown, setHintShown] = useState(false);

  // ── NEW: Study mode answer reveal ──
  const [studyReveal, setStudyReveal] = useState<QuestionEvaluation | null>(null);

  // Fullscreen tracking
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-Cheat & Proctoring State
  const [antiCheatActive, setAntiCheatActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [warningReason, setWarningReason] = useState('');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef(3);
  const hasTerminatedRef = useRef(false);

  // Difficulty transition toast
  const [difficultyToast, setDifficultyToast] = useState<{
    prev: DifficultyLevel;
    next: DifficultyLevel;
    reason?: string;
  } | null>(null);

  const isStudyMode = !!(session?.studyMode);

  // Fetch initial session
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        const data = await res.json();
        if (data.success && data.session) {
          if (data.session.status === 'COMPLETED' || data.session.status === 'TERMINATED_VIOLATION') {
            router.push(`/report/${sessionId}`);
            return;
          }
          setSession(data.session);
          setIntegrityScore(data.session.integrityScore || 100);
        } else {
          router.push('/setup');
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId, router]);

  // ── Timer: reset & countdown each question ──
  useEffect(() => {
    if (!session || loading) return;

    setTimeLeft(TIME_LIMIT);
    autoSubmittingRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!autoSubmittingRef.current && !isStudyMode) {
            autoSubmittingRef.current = true;
            // auto-submit with whatever is chosen/typed
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentQuestionIndex, loading]);

  // Reset hint & reveal on question change
  useEffect(() => {
    setHintShown(false);
    setStudyReveal(null);
    setUserAnswer('');
    setSelectedOptionIndex(null);
  }, [session?.currentQuestionIndex]);

  // Stop speech when changing question
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [session?.currentQuestionIndex]);

  // Fullscreen
  const requestAppFullscreen = async () => {
    if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (isStudyMode) return; // no fullscreen in study mode

    requestAppFullscreen();

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      if (!inFullscreen && !hasTerminatedRef.current) {
        startAntiCheatCountdown('Full-Screen Mode was exited! Please re-enter full-screen immediately.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudyMode]);

  // Speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const recognizer = new SR();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';
        recognizer.onresult = (event: any) => {
          let t = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            t += event.results[i][0].transcript;
          }
          if (t.trim()) setUserAnswer(prev => prev.trim() ? `${prev.trim()} ${t}` : t);
        };
        recognizer.onerror = () => setIsListening(false);
        recognizer.onend = () => setIsListening(false);
        recognitionRef.current = recognizer;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Speech Recognition is not supported in this browser.'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { try { recognitionRef.current.start(); setIsListening(true); } catch (e) {} }
  };

  const cycleSpeechRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.75];
    const next = rates[(rates.indexOf(speechRate) + 1) % rates.length];
    setSpeechRate(next);
  };

  const handleToggleSpeakQuestion = () => {
    if (!('speechSynthesis' in window)) { alert('Text-to-speech is not supported.'); return; }
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
    else {
      const q = session?.questions[session.currentQuestionIndex || 0];
      if (q) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(q.question);
        utt.rate = speechRate; utt.pitch = 0.95;
        utt.onend = () => setIsSpeaking(false);
        utt.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utt);
      }
    }
  };

  // Anti-cheat (only in normal mode)
  const terminateSessionDueToViolation = async (reason: string) => {
    if (hasTerminatedRef.current) return;
    hasTerminatedRef.current = true;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await fetch(`/api/session/${sessionId}/terminate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'ANTI_CHEAT_VIOLATION', details: reason })
      });
    } catch (err) {}
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch (e) {}
    }
    router.push(`/report/${sessionId}`);
  };

  const startAntiCheatCountdown = (reason: string) => {
    if (hasTerminatedRef.current || antiCheatActive || isStudyMode) return;
    setWarningReason(reason); setAntiCheatActive(true); setCountdown(3); countdownRef.current = 3;
    playWarningBeep();
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      playWarningBeep();
      if (countdownRef.current <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        terminateSessionDueToViolation(reason);
      }
    }, 1000);
  };

  const handleReturnToFocus = async () => {
    if (countdownRef.current > 0 && !hasTerminatedRef.current) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setAntiCheatActive(false);
      await requestAppFullscreen();
      const penalty = 10;
      setIntegrityScore(prev => Math.max(0, prev - penalty));
      fetch(`/api/session/${sessionId}/proctor-log`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { id: `proc-${Date.now()}`, type: 'FULLSCREEN_EXIT', timestamp: new Date().toISOString(), details: `Focus lost (${warningReason}). Returned in grace period.`, penaltyApplied: penalty } as ProctorEvent })
      }).catch(console.error);
    }
  };

  useEffect(() => {
    if (isStudyMode) return;
    const onVisibility = () => { if (document.visibilityState === 'hidden') startAntiCheatCountdown('Browser tab switched or minimized.'); };
    const onBlur = () => startAntiCheatCountdown('Window focus lost.');
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = 'Active proctored exam in progress.'; return e.returnValue; };
    const onKey = (e: KeyboardEvent) => { if (e.altKey && e.key === 'Tab') startAntiCheatCountdown('Alt+Tab shortcut detected.'); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('keydown', onKey);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, antiCheatActive, isStudyMode]);

  const submitAnswer = async (answerOverride?: string, optionOverride?: number) => {
    if (!session || isSubmittingRef.current || isRedirectingRef.current) return;
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    setSubmitWarning(null);
    setSubmitError(null);

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }
    if (timerRef.current) clearInterval(timerRef.current);

    const prevDiff = session.currentDifficulty;
    const finalOption = optionOverride !== undefined ? optionOverride : selectedOptionIndex;
    const finalAnswer = answerOverride !== undefined ? answerOverride : (
      currentQuestion.type === 'MCQ'
        ? (currentQuestion.options?.[finalOption ?? 0] || '')
        : userAnswer
    );

    try {
      const res = await fetch(`/api/session/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: finalAnswer,
          selectedOptionIndex: currentQuestion.type === 'MCQ' ? (finalOption ?? 0) : undefined,
          hintUsed: hintShown
        })
      });

      const data = await res.json().catch(() => ({ success: false, error: 'Server evaluation failed' }));

      if (data.success) {
        // Update streak
        if (data.evaluation?.isCorrect) setStreak(s => s + 1);
        else setStreak(0);

        if (data.isCompleted) {
          isRedirectingRef.current = true;
          hasTerminatedRef.current = true; // prevent fullscreenchange from triggering anti-cheat
          if (typeof document !== 'undefined' && document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch (e) {}
          }
          router.push(`/report/${sessionId}`);
          return;
        }

        if (isStudyMode && data.evaluation) {
          setStudyReveal(data.evaluation);
          setSession(data.session);
          if (data.evaluation.nextDifficulty && data.evaluation.nextDifficulty !== prevDiff) {
            setDifficultyToast({ prev: prevDiff, next: data.evaluation.nextDifficulty, reason: data.evaluation.difficultyChangeReason });
            setTimeout(() => setDifficultyToast(null), 5000);
          }
        } else {
          setSession(data.session);
          setUserAnswer('');
          setSelectedOptionIndex(null);
          setHintShown(false);
          if (data.evaluation?.nextDifficulty && data.evaluation.nextDifficulty !== prevDiff) {
            setDifficultyToast({ prev: prevDiff, next: data.evaluation.nextDifficulty, reason: data.evaluation.difficultyChangeReason });
            setTimeout(() => setDifficultyToast(null), 5000);
          }
        }
      } else {
        // If the session was already completed or terminated, immediately redirect to report
        if (data.error?.includes('already COMPLETED') || data.error?.includes('already TERMINATED')) {
          isRedirectingRef.current = true;
          hasTerminatedRef.current = true;
          if (typeof document !== 'undefined' && document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch (e) {}
          }
          router.push(`/report/${sessionId}`);
          return;
        }
        setSubmitError(data.error || 'Evaluation timed out. Please click Submit Answer again.');
      }
    } catch (err: any) {
      console.error('Failed to submit answer:', err);
      setSubmitError('Connection interrupted. Please click Submit Answer again.');
    } finally {
      if (!isRedirectingRef.current) {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (submitting || isSubmittingRef.current || isRedirectingRef.current) return;
    if (!session) return;
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return;

    if (currentQuestion.type === 'MCQ' && (selectedOptionIndex === null || selectedOptionIndex === undefined)) {
      setSubmitWarning('Please select an option before submitting.');
      return;
    }

    if (currentQuestion.type === 'WRITTEN' && !userAnswer.trim()) {
      setSubmitWarning('Please articulate your response by typing or speaking before submitting.');
      return;
    }

    setSubmitWarning(null);
    setSubmitError(null);
    await submitAnswer();
  };

  const handleAutoSubmit = async () => {
    if (!session || isSubmittingRef.current || isRedirectingRef.current) return;
    const q = session.questions[session.currentQuestionIndex];
    if (!q) return;
    const autoAnswer = q.type === 'MCQ' ? (q.options?.[0] || '') : 'Time expired — no answer provided.';
    const autoOption = q.type === 'MCQ' ? 0 : undefined;
    await submitAnswer(autoAnswer, autoOption);
  };

  const handleNextInStudyMode = () => {
    setStudyReveal(null);
    setUserAnswer('');
    setSelectedOptionIndex(null);
    setHintShown(false);
    setSubmitWarning(null);
    setSubmitError(null);
    setTimeLeft(TIME_LIMIT);
  };

  // Keyboard Shortcuts (1-4, a-d for MCQ, H for hint, Ctrl+Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
        return;
      }

      // Ignore single key navigation when typing inside input or textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        return;
      }

      const activeQ = session?.questions[session?.currentQuestionIndex];
      if (!activeQ) return;

      // 'h' or 'H' to show hint
      if ((e.key === 'h' || e.key === 'H') && !hintShown) {
        e.preventDefault();
        setHintShown(true);
        return;
      }

      // 1-4 or a-d for MCQ options
      if (activeQ.type === 'MCQ' && activeQ.options) {
        let optIdx = -1;
        if (['1', '2', '3', '4'].includes(e.key)) {
          optIdx = parseInt(e.key, 10) - 1;
        } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
          optIdx = e.key.toLowerCase().charCodeAt(0) - 97;
        }
        if (optIdx >= 0 && optIdx < activeQ.options.length) {
          e.preventDefault();
          setSelectedOptionIndex(optIdx);
          setSubmitWarning(null);
          setSubmitError(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, hintShown, selectedOptionIndex, userAnswer, submitting]);

  if (!authorized || loading || !session) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">{!authorized ? 'Checking authentication...' : isStudyMode ? 'Loading Study Session...' : 'Entering Fullscreen Proctored Chamber...'}</p>
        </div>
      </div>
    );
  }

  const currentQ: QuestionItem | undefined = session.questions[session.currentQuestionIndex];
  const lastEval: QuestionEvaluation | undefined = session.evaluations[session.evaluations.length - 1];
  const hintText = currentQ?.explanation ? currentQ.explanation.substring(0, 100) + '...' : 'No hint available for this question.';

  // Timer color
  const timerColor = timeLeft > 60 ? 'bg-emerald-500' : timeLeft > 30 ? 'bg-amber-500' : 'bg-rose-500';
  const timerTextColor = timeLeft > 60 ? 'text-emerald-400' : timeLeft > 30 ? 'text-amber-400' : 'text-rose-400';

  // Difficulty steps
  const diffSteps: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Expert'];
  const currentDiffIdx = diffSteps.indexOf(session.currentDifficulty);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col select-none relative">
      <Navbar />

      {/* Study Mode Banner */}
      {isStudyMode && (
        <div className="w-full bg-indigo-950/80 border-b border-indigo-500/40 px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          🧪 Study Mode — Relaxed Practice | No Proctoring | Answers shown after each question
        </div>
      )}

      {/* Anti-Cheat Modal (normal mode only) */}
      {antiCheatActive && !isStudyMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="relative w-full max-w-lg rounded-3xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl shadow-rose-600/50 p-8 text-center overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-6 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs mb-3 border border-rose-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />PROCTOR BREACH DETECTED
            </div>
            <h2 className="text-2xl font-black text-white mb-2">EXAMINATION FOCUS LOST!</h2>
            <p className="text-xs text-rose-200/90 mb-6 leading-relaxed">{warningReason}</p>
            <div className="my-6">
              <div className="text-6xl font-black text-rose-400 font-mono tracking-widest drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]">0{countdown}</div>
              <p className="text-[11px] font-mono text-rose-300 uppercase tracking-widest mt-2">Seconds until automatic disqualification</p>
            </div>
            <button onClick={handleReturnToFocus} className="w-full py-3.5 rounded-xl font-bold text-sm bg-white text-rose-950 hover:bg-rose-100 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
              <Maximize2 className="w-4 h-4" />Restore Full Screen & Resume Test
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left HUD (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Candidate info strip (replaces camera) */}
          <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-0.5">Candidate</div>
              <div className="text-xs font-semibold text-slate-200 truncate max-w-[160px]">{session.userName}</div>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-full border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isStudyMode ? 'STUDY' : 'LIVE'}
            </span>
          </div>

          {/* Metrics */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            
            {/* Integrity */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isStudyMode ? 'Study Progress' : 'Academic Integrity'}
                </span>
                <span className={`font-mono font-bold ${integrityScore >= 90 ? 'text-emerald-400' : integrityScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {integrityScore}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${integrityScore >= 90 ? 'bg-emerald-500' : integrityScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${integrityScore}%` }} />
              </div>
            </div>

            {/* ── Streak Counter ── */}
            <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${streak >= 2 ? 'bg-amber-950/30 border-amber-500/40' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Flame className={`w-4 h-4 ${streak >= 2 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                <span className={streak >= 2 ? 'text-amber-300' : 'text-slate-400'}>Streak</span>
              </div>
              <span className={`font-mono font-bold text-lg ${streak >= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                {streak >= 2 ? `🔥 ${streak}` : streak > 0 ? `${streak}` : '0'}
              </span>
            </div>

            {/* ── Difficulty Roadmap ── */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Adaptive Difficulty Roadmap</div>
              <div className="flex items-center gap-1">
                {diffSteps.map((step, i) => (
                  <React.Fragment key={step}>
                    <div className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition-all ${
                      i === currentDiffIdx
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                        : i < currentDiffIdx
                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30'
                        : 'bg-slate-900 text-slate-600 border border-slate-800'
                    }`}>
                      {step === 'Beginner' ? 'Beginner' : step === 'Intermediate' ? 'Mid' : 'Expert'}
                    </div>
                    {i < 2 && <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Type</div>
                <div className="text-xs font-bold text-indigo-400 mt-0.5">
                  {currentQ?.type === 'MCQ' ? 'MCQ Bit' : 'Written Viva'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Progress</div>
                <div className={`text-sm font-mono font-bold mt-0.5 ${timerTextColor}`}>
                  {session.currentQuestionIndex + 1}/{session.totalQuestions}
                </div>
              </div>
            </div>

            {/* Progress dots */}
            <div>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {Array.from({ length: session.totalQuestions }).map((_, idx) => {
                  const isDone = idx < session.currentQuestionIndex;
                  const isCurrent = idx === session.currentQuestionIndex;
                  const ev = session.evaluations[idx];
                  return (
                    <div key={idx} className={`h-2 rounded-full transition-all ${
                      isDone ? (ev?.isCorrect ? 'bg-emerald-500' : 'bg-rose-500') : isCurrent ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'
                    }`} title={`Q${idx + 1}`} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Previous Feedback */}
          {lastEval && !studyReveal && (
            <div className={`p-4 rounded-2xl border ${lastEval.isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  {lastEval.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  <span className={lastEval.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                    Prev: {lastEval.isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </span>
                </span>
                <span className="font-mono text-xs text-slate-300">{lastEval.score}/100</span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-3">"{lastEval.feedback}"</p>
            </div>
          )}
        </div>

        {/* Right: Question + Answer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* ── Timer Bar ── */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">{isStudyMode ? 'Time Elapsed' : 'Time Remaining'}</span>
              </div>
              <span className={`font-mono font-bold text-sm ${timerTextColor}`}>
                {isStudyMode 
                  ? `${TIME_LIMIT - timeLeft}s elapsed`
                  : `${timeLeft}s ${timeLeft <= 30 ? '⚠' : ''}`}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                style={{ width: isStudyMode ? `${((TIME_LIMIT - timeLeft) / TIME_LIMIT) * 100}%` : `${(timeLeft / TIME_LIMIT) * 100}%` }}
              />
            </div>
          </div>

          {/* Difficulty Change Toast */}
          {difficultyToast && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/40 flex items-center gap-3 animate-fade-in shadow-xl">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                {difficultyToast.next === 'Expert' || difficultyToast.next > difficultyToast.prev
                  ? <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  : <ArrowDownRight className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Adaptive Difficulty: {difficultyToast.prev} → {difficultyToast.next}</div>
                <div className="text-[11px] text-slate-300">{difficultyToast.reason}</div>
              </div>
            </div>
          )}

          {/* Question Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    Prof. VivaSphere AI
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Technical Examiner</span>
                  </div>
                  <div className="text-xs text-slate-400">Subject: <span className="text-slate-200 font-medium">{session.topic}</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Hint button */}
                {currentQ && !hintShown && (
                  <button type="button" onClick={() => setHintShown(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all bg-amber-600/10 border-amber-500/30 text-amber-300 hover:bg-amber-600/20">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hint {!isStudyMode && '(−10pts)'}</span>
                    <kbd className="text-[9px] font-mono px-1 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300">H</kbd>
                  </button>
                )}
                {hintShown && (
                  <span className="text-[10px] font-mono text-amber-400/70 px-2">💡 Hint used{!isStudyMode && ' (−10pts)'}</span>
                )}

                {/* Voice Speed Toggle */}
                <button type="button" onClick={cycleSpeechRate} title="Toggle speech playback speed"
                  className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs font-mono font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{speechRate}x</span>
                </button>

                {/* Speak button */}
                <button type="button" onClick={handleToggleSpeakQuestion}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                    isSpeaking ? 'bg-purple-600 border-purple-500 text-white animate-pulse' : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white'
                  }`}>
                  {isSpeaking ? <><VolumeX className="w-4 h-4" /><span>Stop</span></> : <><Volume2 className="w-4 h-4" /><span>Speak</span></>}
                </button>
              </div>
            </div>

            {currentQ && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">Question #{session.currentQuestionIndex + 1}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-500/40">
                    {currentQ.type === 'MCQ' ? 'MCQ BIT' : 'WRITTEN BIT'}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{currentQ.difficulty}</span>
                  <span className="text-[10px] font-mono text-slate-500">{currentQ.focusArea}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-base sm:text-lg font-medium text-white leading-relaxed">
                  {currentQ.question}
                </div>

                {/* Hint panel */}
                {hintShown && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-mono text-amber-400 uppercase mb-0.5">Hint {!isStudyMode && '(−10 pts penalty applied)'}</div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">{hintText}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Study Mode Reveal Panel */}
          {studyReveal && (
            <div className={`p-5 rounded-2xl border shadow-xl ${studyReveal.isCorrect ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/30 border-rose-500/30'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {studyReveal.isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    : <XCircle className="w-5 h-5 text-rose-400" />}
                  <span className={`text-sm font-bold ${studyReveal.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {studyReveal.isCorrect ? '✓ CORRECT!' : '✗ INCORRECT'} — Score: {studyReveal.score}/100
                  </span>
                </div>
                <button type="button" onClick={handleNextInStudyMode}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition">
                  Next Question <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed mb-2">{studyReveal.feedback}</div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                <div className="text-[10px] font-mono text-emerald-400 mb-1">IDEAL ANSWER / SOLUTION</div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">{studyReveal.idealAnswer}</p>
              </div>
            </div>
          )}

          {/* Answer Area (hidden while study reveal is shown) */}
          {!studyReveal && (
            <div className="flex-1 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              
              {/* MCQ Options */}
              {currentQ?.type === 'MCQ' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <ListOrdered className="w-4 h-4 text-indigo-400" />Select The Correct Option
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">Single Choice</div>
                  </div>
                  <div className="space-y-3 my-2">
                    {currentQ.options?.map((optionText, optIdx) => {
                      const isSelected = selectedOptionIndex === optIdx;
                      const optionLetter = String.fromCharCode(65 + optIdx);
                      return (
                        <button key={optIdx} type="button" onClick={() => { setSelectedOptionIndex(optIdx); setSubmitWarning(null); setSubmitError(null); }}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                            isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                          }`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl font-bold font-mono text-xs flex items-center justify-center transition-all ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>{optionLetter}</span>
                            <span className="text-xs sm:text-sm font-medium">{optionText}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-indigo-300 transition">
                              {optIdx + 1}
                            </kbd>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700'}`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Written Input */}
              {currentQ?.type === 'WRITTEN' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-indigo-400" />Written / Oral Defense
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{userAnswer.split(/\s+/).filter(Boolean).length} words</span>
                      <button type="button" onClick={toggleListening}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          isListening ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500/50'
                        }`}>
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Stop</span>
                            <div className="flex items-end gap-0.5 h-3 ml-0.5">
                              <span className="w-0.5 bg-white rounded-full animate-bounce h-2"></span>
                              <span className="w-0.5 bg-white rounded-full animate-pulse h-3"></span>
                              <span className="w-0.5 bg-white rounded-full animate-bounce h-2.5"></span>
                            </div>
                          </>
                        ) : (
                          <><Mic className="w-3.5 h-3.5" /><span>🎤 Speak Answer</span></>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea rows={6} value={userAnswer} onChange={e => { setUserAnswer(e.target.value); setSubmitWarning(null); setSubmitError(null); }}
                      onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmitAnswer(); }}
                      placeholder="Articulate your technical response... (Press Ctrl+Enter or Cmd+Enter to submit)"
                      className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none font-mono leading-relaxed"
                      disabled={submitting}
                    />
                    {isListening && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/90 text-white text-[10px] font-mono shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <span>LISTENING LIVE</span>
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_100ms] h-2"></span>
                          <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_200ms] h-3"></span>
                          <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite_300ms] h-2.5"></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button & Inline Feedback */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/60 mt-4">
                <div className="flex-1">
                  {submitWarning && (
                    <div className="text-xs text-amber-300 font-medium flex items-center gap-2 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 animate-pulse">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{submitWarning}</span>
                    </div>
                  )}
                  {submitError && (
                    <div className="text-xs text-rose-300 font-medium flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{submitError}</span>
                    </div>
                  )}
                  {!submitWarning && !submitError && (
                    <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/80"></span>
                      {currentQ?.type === 'MCQ'
                        ? selectedOptionIndex !== null
                          ? `Option ${String.fromCharCode(65 + selectedOptionIndex)} selected • Ready to submit`
                          : 'Select an option above to proceed'
                        : userAnswer.trim()
                          ? `${userAnswer.trim().split(/\s+/).length} words ready for review`
                          : 'Type or speak your technical answer'}
                    </div>
                  )}
                </div>

                <button type="button" onClick={handleSubmitAnswer} disabled={submitting}
                  className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shrink-0 ${
                    submitting
                      ? 'bg-slate-800 text-slate-500 cursor-wait'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
                  }`}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Evaluating Answer...</span></>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Answer</span>
                      <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/80 border border-indigo-400/40 text-indigo-200">
                        Ctrl+Enter
                      </kbd>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
