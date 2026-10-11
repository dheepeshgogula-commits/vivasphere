'use client';

import React, { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  History, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowRight, 
  PlusCircle, 
  Loader2, 
  ShieldCheck, 
  BookOpen,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { InterviewSession } from '@/types';

// ── Progress Over Time SVG line chart ──
function ProgressChart({ sessions }: { sessions: InterviewSession[] }) {
  const w = 560, h = 160, padX = 36, padY = 24;
  const scores = sessions.map(s => s.finalScore || 0);
  const maxScore = 100;
  const pts = scores.map((score, i) => ({
    x: padX + (i / Math.max(scores.length - 1, 1)) * (w - padX * 2),
    y: h - padY - (score / maxScore) * (h - padY * 2),
    score
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {gridLines.map(v => {
        const y = h - padY - (v / maxScore) * (h - padY * 2);
        return (
          <g key={v}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgb(30,41,59)" strokeWidth="1" strokeDasharray="4,4" />
            <text x={padX - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="rgb(100,116,139)">{v}</text>
          </g>
        );
      })}
      <polyline points={polyline} fill="none" stroke="rgb(99,102,241)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Gradient area under line */}
      <defs>
        <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts[0]?.x},${h - padY} ${polyline} ${pts[pts.length - 1]?.x},${h - padY}`}
        fill="url(#lineGrad)" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="rgb(99,102,241)" stroke="rgb(15,23,42)" strokeWidth="2" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fill="rgb(148,163,184)">{p.score}</text>
          <text x={p.x} y={h - 4} textAnchor="middle" fontSize="8" fill="rgb(71,85,105)">
            #{sessions[i].id.substring(5, 9)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HistoryPage() {
  const authorized = useAuthGuard();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ name: string; rollNumber?: string; email?: string; college?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vivasphere_user');
      if (stored) {
        try { setCurrentUser(JSON.parse(stored)); } catch (e) {}
      } else {
        setCurrentUser({ name: 'Alex Rivera', rollNumber: 'CS22B048', email: 'alex.rivera@cs.university.edu' });
      }
    }
    async function fetchHistory() {
      try {
        const res = await fetch('/api/user/history');
        const data = await res.json();
        if (data.success && data.sessions) setSessions(data.sessions);
      } catch (err) { console.error('Failed to fetch history:', err); }
      finally { setLoading(false); }
    }
    fetchHistory();
  }, []);

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'TERMINATED_VIOLATION');
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.finalScore || 0), 0) / completedSessions.length) : 0;
  const totalCorrect = completedSessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
  const totalQuestions = completedSessions.reduce((acc, s) => acc + (s.evaluations?.length || s.totalQuestions || 0), 0);

  // ── Topic weakness stats ──
  const topicStatsMap = new Map<string, { total: number; count: number }>();
  completedSessions.forEach(s => {
    const t = s.topic;
    const ex = topicStatsMap.get(t) || { total: 0, count: 0 };
    topicStatsMap.set(t, { total: ex.total + (s.finalScore || 0), count: ex.count + 1 });
  });
  const topicStats = Array.from(topicStatsMap.entries())
    .map(([topic, { total, count }]) => ({ topic, avgScore: Math.round(total / count), count }))
    .sort((a, b) => a.avgScore - b.avgScore);

  const gradeColors: Record<string, string> = {
    S: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/40',
    A: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    B: 'bg-blue-500/10 text-blue-300 border-blue-500/40',
    C: 'bg-purple-500/10 text-purple-300 border-purple-500/40',
    D: 'bg-orange-500/10 text-orange-300 border-orange-500/40',
    F: 'bg-rose-500/10 text-rose-300 border-rose-500/40'
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400 font-mono">Verifying authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Student Transcript</span>
              <span className="text-xs text-slate-500 font-mono">• Official Examination Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
              <History className="w-7 h-7 text-indigo-400" />Viva Voce Attendance & Score History
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Review all examinations attended, past test scores, correct/wrong counts, and proctoring integrity records.
            </p>
          </div>
          <Link href="/setup" className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-2 transition shadow-lg shadow-indigo-600/25">
            <PlusCircle className="w-4 h-4" /><span>Attend New Viva Test</span>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Candidate Profile</div>
              <Link href="/profile" className="text-[10px] text-indigo-400 hover:underline">Edit Profile</Link>
            </div>
            <div className="text-base font-bold text-white mt-1 truncate">{currentUser?.name || 'Alex Rivera'}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.college || 'NIT Trichy'}</div>
            <div className="text-xs text-indigo-400 font-mono mt-0.5">Roll: {currentUser?.rollNumber || 'CS22B048'}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tests Attended</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{completedSessions.length}</div>
            <div className="text-xs text-slate-400 mt-0.5">Cumulative examinations</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Average Score</div>
            <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">{avgScore} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
            <div className="text-xs text-slate-400 mt-0.5">Across all subjects</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Accuracy Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{totalCorrect} of {totalQuestions} correct</div>
          </div>
        </div>

        {/* ── Progress Over Time Chart ── */}
        {completedSessions.length >= 2 && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl mb-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Score Trend</span>
                <h2 className="text-base font-bold text-white mt-0.5">Progress Over Time (Last {Math.min(completedSessions.length, 10)} Exams)</h2>
              </div>
            </div>
            <ProgressChart sessions={completedSessions.slice(-10)} />
          </div>
        )}

        {/* ── Topic Weakness Heatmap ── */}
        {topicStats.length > 0 && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl mb-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Topic Analysis</span>
                <h2 className="text-base font-bold text-white mt-0.5">Subject Performance Heatmap</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {topicStats.map(({ topic, avgScore: ts, count }) => {
                const bg = ts >= 80 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : ts >= 60 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : ts >= 40 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-300';
                const emoji = ts >= 80 ? '🟢' : ts >= 60 ? '🔵' : ts >= 40 ? '🟡' : '🔴';
                return (
                  <div key={topic} className={`p-4 rounded-2xl border ${bg}`}>
                    <div className="text-[10px] font-mono mb-1">{emoji} {ts >= 80 ? 'Strong' : ts >= 60 ? 'Good' : ts >= 40 ? 'Needs Work' : 'Weak Area'}</div>
                    <div className="text-xs font-bold truncate" title={topic}>{topic}</div>
                    <div className="text-2xl font-black font-mono mt-1">{ts}%</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{count} exam{count !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sessions List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-xs">Loading examination transcripts...</p>
          </div>
        ) : completedSessions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Viva Transcripts Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              You haven't attended any viva examinations yet.
            </p>
            <Link href="/setup" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">
              Start Viva Voce Exam
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Examination Sessions ({completedSessions.length})
            </h2>
            <div className="space-y-3">
              {completedSessions.map((s) => {
                const isViolation = s.status === 'TERMINATED_VIOLATION';
                const grade = s.overallFeedback?.grade || (isViolation ? 'F' : 'B');
                const dateFormatted = new Date(s.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                return (
                  <div key={s.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-2xl shrink-0 ${gradeColors[grade] || gradeColors.B}`}>{grade}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{s.topic}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{s.questionMode || 'MIXED'}</span>
                          {s.studyMode && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-500/40">STUDY MODE</span>}
                          {isViolation ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 flex items-center gap-1"><AlertOctagon className="w-3 h-3" />VIOLATION</span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />HONEST</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-mono text-[11px]"><Clock className="w-3.5 h-3.5 text-slate-500" />{dateFormatted}</span>
                          <span>•</span>
                          <span>Tier: <strong className="text-slate-200">{s.initialDifficulty}</strong></span>
                          <span>•</span>
                          <span>Questions: <strong className="text-slate-200">{s.evaluations?.length || s.totalQuestions}</strong></span>
                          {s.correctCount !== undefined && (
                            <><span>•</span>
                              <span className="text-emerald-400 font-semibold font-mono">{s.correctCount} Correct</span>
                              <span>/</span>
                              <span className="text-rose-400 font-semibold font-mono">{s.incorrectCount || 0} Wrong</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Test Score</div>
                        <div className="text-xl font-bold font-mono text-white">{s.finalScore} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
                      </div>
                      <Link href={`/report/${s.id}`} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition">
                        <span>View Report</span><ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
