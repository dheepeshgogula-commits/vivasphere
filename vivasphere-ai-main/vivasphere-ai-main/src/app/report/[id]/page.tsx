'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import confetti from 'canvas-confetti';

import { 
  Award, 
  Download, 
  CheckCircle2, 
  XCircle,
  AlertOctagon, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  ChevronDown, 
  ChevronUp, 
  Loader2,
  History,
  Check,
  X,
  Copy,
  RotateCcw
} from 'lucide-react';
import { InterviewSession, QuestionEvaluation } from '@/types';

// ── SVG Pentagon Radar Chart ──
function RadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  const cx = 150, cy = 150, r = 100;
  const N = scores.length;
  const angles = scores.map((_, i) => ((i * 360) / N - 90) * (Math.PI / 180));
  const pt = (radius: number, i: number) => ({
    x: cx + radius * Math.cos(angles[i]),
    y: cy + radius * Math.sin(angles[i]),
  });
  const gridPolygons = [0.33, 0.66, 1].map(scale =>
    angles.map((_, i) => { const p = pt(r * scale, i); return `${p.x},${p.y}`; }).join(' ')
  );
  const dataPoints = scores.map((s, i) => {
    const p = pt(r * Math.max(s.value, 5) / 100, i);
    return `${p.x},${p.y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[240px] mx-auto">
      {gridPolygons.map((pts, gi) => (
        <polygon key={gi} points={pts} fill="none" stroke="rgb(51,65,85)" strokeWidth="1" />
      ))}
      {angles.map((_, i) => {
        const end = pt(r, i);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgb(51,65,85)" strokeWidth="1" />;
      })}
      <polygon points={dataPoints} fill="rgba(99,102,241,0.25)" stroke="rgb(99,102,241)" strokeWidth="2" />
      {scores.map((s, i) => {
        const labelPt = pt(r + 26, i);
        return (
          <text key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="rgb(148,163,184)">
            {s.label} {s.value}%
          </text>
        );
      })}
      {scores.map((s, i) => {
        const dotPt = pt(r * Math.max(s.value, 5) / 100, i);
        return <circle key={i} cx={dotPt.x} cy={dotPt.y} r="3" fill="rgb(99,102,241)" />;
      })}
    </svg>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const authorized = useAuthGuard();
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [showCertNotice, setShowCertNotice] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const xpAwardedRef = useRef(false);

  // ── AI Coach ──
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState<{role:'user'|'ai'; text:string}[]>([]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  // ── Bookmarks ──
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          if (data.session.status !== 'TERMINATED_VIOLATION' && data.session.finalScore >= 60) {
            try { confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } }); } catch (e) {}
          }
          // Award XP once
          if (!xpAwardedRef.current && data.session.status === 'COMPLETED') {
            xpAwardedRef.current = true;
            const xpGained = Math.round((data.session.finalScore || 0) * 1.5);
            fetch('/api/user/stats', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.session.userId, xpGained, score: data.session.finalScore, grade: data.session.overallFeedback?.grade || '' })
            }).catch(() => {});
          }
          // Load bookmarks
          const userId = data.session.userId || 'usr-alex';
          const bRes = await fetch(`/api/user/bookmarks?userId=${userId}&sessionId=${sessionId}`);
          const bData = await bRes.json();
          if (bData.success) setBookmarks(bData.bookmarks || []);
        }
      } catch (err) { console.error('Error fetching report:', err); }
      finally { setLoading(false); }
    }
    loadReport();
  }, [sessionId]);

  const toggleBookmark = async (questionIndex: number) => {
    const userId = session?.userId || 'usr-alex';
    try {
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, questionIndex })
      });
      const data = await res.json();
      if (data.success) setBookmarks(data.bookmarks || []);
    } catch (e) {}
  };

  const handleCoachSend = async (manualQuestion?: string) => {
    const question = (manualQuestion !== undefined ? manualQuestion : coachInput).trim();
    if (!question || coachLoading) return;
    setCoachInput('');
    setCoachMessages(prev => [...prev, { role: 'user', text: question }]);
    setCoachLoading(true);

    const sessionData = session ? {
      topic: session.topic,
      score: session.finalScore,
      grade: session.overallFeedback?.grade || (session.finalScore >= 90 ? 'S' : session.finalScore >= 80 ? 'A' : session.finalScore >= 70 ? 'B' : session.finalScore >= 60 ? 'C' : session.finalScore >= 50 ? 'D' : 'F'),
      evaluations: session.evaluations || [],
      rubricScores: session.rubricScores,
      feedback: session.overallFeedback
    } : null;

    const sessionContext = session ? `Topic: ${session.topic}\nScore: ${session.finalScore}%\nGrade: ${session.overallFeedback?.grade || 'N/A'}\n${session.evaluations?.map((e, i) => `Q${i+1}: ${e.question} — Answer: "${e.userAnswer}" — Correct: ${e.isCorrect ? 'Yes' : 'No'}`).join('\n')}` : '';

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionContext, sessionData })
      });
      const d = await res.json();
      setCoachMessages(prev => [...prev, { role: 'ai', text: d.answer || "I'm here to help analyze your viva! Ask me about specific questions, concepts, or improvement tips." }]);
    } catch {
      setCoachMessages(prev => [...prev, { role: 'ai', text: 'Connection interrupted. Please try again.' }]);
    } finally {
      setCoachLoading(false);
    }
  };


  const toggleQuestion = (idx: number) => {
    setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#07090e' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`VivaSphere-Report-${session?.topic.replace(/\s+/g, '_')}-${sessionId.substring(0, 8)}.pdf`);
    } catch (err) {
      console.warn('Fallback to print:', err);
      window.print();
    } finally { setIsExportingPdf(false); }
  };

  const handleDownloadCertificate = () => {
    if (!session) return;
    const isViolation = session.status === 'TERMINATED_VIOLATION';
    const grade = isViolation ? 'F' : (session.overallFeedback?.grade || (session.finalScore >= 90 ? 'S' : session.finalScore >= 80 ? 'A' : session.finalScore >= 70 ? 'B' : session.finalScore >= 60 ? 'C' : session.finalScore >= 50 ? 'D' : 'F'));

    // Only Grade A or S (Score >= 80) qualify for certificate
    if (['B', 'C', 'D', 'F'].includes(grade) || isViolation || session.finalScore < 80) {
      setShowCertNotice(true);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 800;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0a0e1a'); grad.addColorStop(1, '#0d0a1e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 1160, 760);
    ctx.strokeStyle = 'rgba(99,102,241,0.3)'; ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, 1136, 736);
    ctx.fillStyle = '#818cf8'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
    ctx.fillText('✦  VIVASPHERE AI  —  CERTIFICATE OF COMPLETION  ✦', 600, 85);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText('Certificate of Achievement', 600, 200);
    ctx.fillStyle = '#94a3b8'; ctx.font = '22px Arial, sans-serif';
    ctx.fillText('This is to certify that', 600, 270);
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(session.userName, 600, 340);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px Arial, sans-serif';
    ctx.fillText('has successfully completed the technical viva examination in', 600, 400);
    ctx.fillStyle = '#818cf8'; ctx.font = 'bold 36px Georgia, serif';
    ctx.fillText(session.topic, 600, 455);
    ctx.fillStyle = '#94a3b8'; ctx.font = '18px Arial, sans-serif';
    const dateStr = new Date(session.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    ctx.fillText(`Final Score: ${session.finalScore}/100  •  Grade: ${grade}  •  Date: ${dateStr}`, 600, 520);
    ctx.fillStyle = '#475569'; ctx.font = '13px monospace';
    ctx.fillText(`Session ID: ${session.id}  |  Integrity Score: ${session.integrityScore}%  |  Verified by VivaSphere AI`, 600, 615);
    ctx.fillStyle = '#6366f1'; ctx.font = 'bold 15px monospace';
    ctx.fillText('VivaSphere AI  —  Technical Viva & Interview Simulator', 600, 680);
    // decorative stars
    ctx.fillStyle = 'rgba(99,102,241,0.4)'; ctx.font = '24px serif';
    ['70,70','1130,70','70,730','1130,730'].forEach(pos => {
      const [px, py] = pos.split(',').map(Number);
      ctx.fillText('✦', px, py);
    });
    const link = document.createElement('a');
    link.download = `VivaSphere-Certificate-${session.userName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopySummary = async () => {
    if (!session) return;
    const evaluations = session.evaluations || [];
    const correctCount = session.correctCount !== undefined ? session.correctCount : evaluations.filter(e => e.isCorrect).length;
    const summary = [
      `🎓 VivaSphere AI — Technical Viva Examination Report`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Student: ${session.userName}`,
      `Subject: ${session.topic}`,
      `Date: ${new Date(session.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      `Final Score: ${session.finalScore}/100 (Grade: ${session.overallFeedback?.grade || 'B'})`,
      `Correct Answers: ${correctCount}/${evaluations.length}`,
      `Academic Integrity: ${session.integrityScore}%`,
      ``,
      `Assessment Summary:`,
      session.overallFeedback?.summary || 'N/A',
      ``,
      `Key Strengths:`,
      ...((session.overallFeedback?.coreStrengths as string[]) || []).map((s: string) => `• ${s}`),
      ``,
      `Areas for Growth:`,
      ...((session.overallFeedback?.knowledgeGaps as string[]) || []).map((i: string) => `• ${i}`),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Session ID: ${session.id} | Verified by VivaSphere AI`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handleRetakeWeakQuestions = async () => {
    if (!session || retaking) return;
    const evaluations = session.evaluations || [];
    const weakIndices = evaluations
      .map((ev, idx) => (!ev.isCorrect ? idx : -1))
      .filter(idx => idx !== -1);

    const weakQuestions = weakIndices
      .map(i => session.questions[i])
      .filter(Boolean);

    if (weakQuestions.length === 0) {
      alert('Outstanding! You scored 100% on all questions in this session.');
      return;
    }

    setRetaking(true);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${session.topic} (Targeted Practice)`,
          difficulty: session.currentDifficulty,
          totalQuestions: weakQuestions.length,
          questionMode: session.questionMode || 'MIXED',
          studyMode: true,
          customQuestions: weakQuestions,
          userName: session.userName,
          userId: session.userId,
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        router.push(`/interview/${data.session.id}`);
      } else {
        alert('Could not initialize practice session.');
        setRetaking(false);
      }
    } catch (err) {
      console.error('Failed to initialize remediation session:', err);
      setRetaking(false);
    }
  };

  if (!authorized || loading || !session) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium">{!authorized ? 'Checking authentication...' : 'Computing Final Examination Score & Review...'}</p>
        </div>
      </div>
    );
  }

  const isViolation = session.status === 'TERMINATED_VIOLATION';
  const fb = session.overallFeedback;
  const evaluations = session.evaluations || [];
  const correctCount = session.correctCount !== undefined ? session.correctCount : evaluations.filter(e => e.isCorrect).length;
  const incorrectCount = evaluations.length - correctCount;
  const rubric = session.rubricScores || { conceptualClarity: 70, technicalDepth: 65, terminologyAccuracy: 75, practicalApplication: 60 };

  const gradeColors: Record<string, string> = {
    S: 'from-amber-400 to-yellow-500 text-yellow-300 border-yellow-500/50 bg-yellow-500/10 shadow-yellow-500/20',
    A: 'from-emerald-400 to-teal-500 text-emerald-300 border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/20',
    B: 'from-blue-400 to-indigo-500 text-blue-300 border-blue-500/50 bg-blue-500/10 shadow-blue-500/20',
    C: 'from-purple-400 to-pink-500 text-purple-300 border-purple-500/50 bg-purple-500/10 shadow-purple-500/20',
    D: 'from-orange-400 to-rose-500 text-orange-300 border-orange-500/50 bg-orange-500/10 shadow-orange-500/20',
    F: 'from-rose-600 to-red-700 text-rose-300 border-rose-600/50 bg-rose-600/10 shadow-rose-600/20'
  };
  const activeGrade = fb?.grade || (isViolation ? 'F' : (session.finalScore >= 90 ? 'S' : session.finalScore >= 80 ? 'A' : session.finalScore >= 70 ? 'B' : session.finalScore >= 60 ? 'C' : session.finalScore >= 50 ? 'D' : 'F'));
  const gradeStyle = gradeColors[activeGrade] || gradeColors.B;

  const radarScores = [
    { label: 'Accuracy', value: rubric.terminologyAccuracy },
    { label: 'Depth', value: rubric.technicalDepth },
    { label: 'Clarity', value: rubric.conceptualClarity },
    { label: 'Application', value: rubric.practicalApplication },
    { label: 'Integrity', value: session.integrityScore },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Top Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Official Exam Result</span>
              <span className="text-xs text-slate-500 font-mono">#{sessionId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Final Examination Score & Answer Review
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/history" className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 flex items-center gap-2 transition">
              <History className="w-4 h-4 text-indigo-400" /><span>All Past Tests</span>
            </Link>
            <button onClick={handleCopySummary}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition ${
                copied 
                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300' 
                  : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-200'
              }`}>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{copied ? '✓ Copied!' : 'Copy Summary'}</span>
            </button>
            {incorrectCount > 0 && (
              <button onClick={handleRetakeWeakQuestions} disabled={retaking}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/50 border border-rose-500/40 hover:border-rose-500/70 text-rose-300 flex items-center gap-2 transition">
                {retaking ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <RotateCcw className="w-4 h-4 text-rose-400" />}
                <span>{retaking ? 'Preparing...' : `Practice Missed (${incorrectCount})`}</span>
              </button>
            )}
            <button onClick={handleDownloadPDF} disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 text-white flex items-center gap-2 transition">
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Download className="w-4 h-4 text-indigo-400" />}
              <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
            </button>
            <button onClick={handleDownloadCertificate}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-950/60 border border-amber-500/40 hover:border-amber-500/70 text-amber-300 flex items-center gap-2 transition">
              <Award className="w-4 h-4 text-amber-400" /><span>🏆 Certificate</span>
            </button>
            <Link href="/setup" className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition shadow-md shadow-indigo-600/20">
              <RefreshCw className="w-4 h-4" /><span>New Exam</span>
            </Link>
          </div>
        </div>

        <div ref={reportRef} className="space-y-8 p-1 sm:p-4 rounded-3xl bg-[#07090e]">
          
          {/* Proctoring Status */}
          {isViolation ? (
            <div className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/50 shadow-xl flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0"><AlertOctagon className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  Academic Integrity Violation
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">DISQUALIFIED</span>
                </div>
                <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                  {session.terminatedReason || 'Window focus was lost or full-screen was exited for over 3 seconds.'} Test was auto-submitted with integrity penalty.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Verified Honest Examination</div>
                  <div className="text-[11px] text-slate-400">
                    Integrity Rating: <span className="font-mono text-emerald-400 font-bold">{session.integrityScore}%</span>
                    {session.studyMode && <span className="ml-2 text-indigo-400">• Study Mode</span>}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block text-right font-mono text-[10px] text-slate-500">PROCTOR AUDIT: PASSED</div>
            </div>
          )}

          {/* Performance Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">Overall Grade</span>
              <div className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center font-black text-5xl shadow-2xl ${gradeStyle}`}>{activeGrade}</div>
              <div className="text-sm font-bold text-white mt-3">{fb?.gradeDescription || (isViolation ? 'Disqualified' : 'Passed')}</div>
              <div className="text-xs text-slate-400 font-mono mt-1">{session.userName}</div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Test Score</div>
                  <div className="text-2xl font-black font-mono text-white mt-1">{session.finalScore} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Correct / Wrong</div>
                  <div className="text-lg font-bold font-mono mt-1 flex items-center gap-1.5">
                    <span className="text-emerald-400">{correctCount} ✓</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-rose-400">{incorrectCount} ✗</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Percentile</div>
                  <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{fb?.percentile || 85}th</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Subject</div>
                  <div className="text-xs font-semibold text-slate-200 mt-1 truncate">{session.topic}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />Professor Viva Voce Assessment
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{fb?.summary}</p>
              </div>
            </div>
          </div>

          {/* Rubric Bars */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Competence Matrix</span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">Technical Rubric Breakdown</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Conceptual Clarity', score: rubric.conceptualClarity, desc: 'Foundational laws and invariant definitions.' },
                { label: 'Technical Depth', score: rubric.technicalDepth, desc: 'Memory layouts, latency tradeoffs, and internals.' },
                { label: 'Terminology Accuracy', score: rubric.terminologyAccuracy, desc: 'Formal CS vocabulary and standard terms.' },
                { label: 'Practical Application', score: rubric.practicalApplication, desc: 'Real-world problem solving and edge-case handling.' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{item.label}</span>
                      <span className="font-mono text-indigo-400 font-bold">{item.score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${item.score}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Radar Chart ── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="mb-5">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Performance Radar</span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">Competence Spider Chart</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <RadarChart scores={radarScores} />
              <div className="space-y-2.5 flex-1 w-full">
                {[
                  { label: 'Terminology Accuracy', value: rubric.terminologyAccuracy, color: 'bg-indigo-500' },
                  { label: 'Technical Depth', value: rubric.technicalDepth, color: 'bg-purple-500' },
                  { label: 'Conceptual Clarity', value: rubric.conceptualClarity, color: 'bg-violet-500' },
                  { label: 'Practical Application', value: rubric.practicalApplication, color: 'bg-blue-500' },
                  { label: 'Academic Integrity', value: session.integrityScore, color: 'bg-emerald-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-28 text-[11px] text-slate-400 text-right shrink-0">{item.label}</div>
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full transition-all duration-700`} style={{ width: `${item.value}%` }} />
                    </div>
                    <div className="w-10 text-[11px] font-mono text-slate-300 shrink-0 text-right">{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Q&A Review */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Answer Review</span>
                <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">Question-by-Question Bits Evaluation</h2>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="w-4 h-4" /> {correctCount} Correct</span>
                <span className="flex items-center gap-1 text-rose-400 font-bold"><XCircle className="w-4 h-4" /> {incorrectCount} Wrong</span>
              </div>
            </div>

            <div className="space-y-4">
              {evaluations.map((ev, idx) => {
                const isExpanded = expandedQuestions[idx] !== false;
                const originalQ = session.questions[idx];
                const isMcq = ev.type === 'MCQ';
                return (
                  <div key={idx} className={`rounded-2xl border transition-all overflow-hidden ${ev.isCorrect ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-slate-950/70 border-rose-500/30'}`}>
                    <button type="button" onClick={() => toggleQuestion(idx)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">Q{idx + 1}</span>
                        {ev.isCorrect
                          ? <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"><Check className="w-3.5 h-3.5" />CORRECT</span>
                          : <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1"><X className="w-3.5 h-3.5" />WRONG</span>}
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/80 hidden sm:inline-block">{isMcq ? 'MCQ BIT' : 'WRITTEN BIT'}</span>
                        <span className="text-xs font-semibold text-white truncate max-w-sm sm:max-w-md">{ev.question}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-xs font-bold ${ev.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>{ev.score} / 100</span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggleBookmark(idx); }}
                          title={bookmarks.includes(idx) ? 'Remove bookmark' : 'Bookmark this question'}
                          className={`p-1 rounded-lg transition-colors text-base ${bookmarks.includes(idx) ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                        >⭐</button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-5 pt-1 border-t border-slate-800/60 space-y-3.5 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 font-medium">{ev.question}</div>

                        {isMcq && originalQ?.options && (
                          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="text-[10px] font-mono text-slate-400 uppercase">MCQ Options Review:</div>
                            <div className="space-y-1.5">
                              {originalQ.options.map((opt, optIdx) => {
                                const isUserPick = ev.selectedOptionIndex === optIdx;
                                const isCorrectAnswer = originalQ.correctOptionIndex === optIdx;
                                return (
                                  <div key={optIdx} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                    isCorrectAnswer ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                                      : isUserPick ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                                      <span>{opt}</span>
                                    </div>
                                    <div className="text-[10px] font-mono">
                                      {isCorrectAnswer && <span className="text-emerald-400 font-bold">✓ CORRECT</span>}
                                      {isUserPick && !isCorrectAnswer && <span className="text-rose-400 font-bold">✗ YOUR PICK</span>}
                                      {isUserPick && isCorrectAnswer && <span className="text-emerald-400 font-bold">(YOUR PICK ✓)</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {!isMcq && (
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                            <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Your Written Answer:</div>
                            <p className="text-slate-200 leading-relaxed font-mono">{ev.userAnswer || '(No answer provided)'}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                            <div className="text-[10px] font-mono text-indigo-300 uppercase mb-1">Professor Assessment:</div>
                            <p className="text-slate-300 leading-relaxed">{ev.feedback}</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                            <div className="text-[10px] font-mono text-emerald-300 uppercase mb-1">Benchmark Solution:</div>
                            <p className="text-emerald-200/90 leading-relaxed">{ev.idealAnswer}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Certificate Unavailable Notice Modal */}
        {showCertNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-lg shadow-amber-500/10">
                <AlertTriangle className="w-7 h-7" />
              </div>
              
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Certification Criteria</span>
              <h3 className="text-xl font-extrabold text-white mt-1 mb-2">
                Certificate Not Available
              </h3>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 mb-4">
                <div className="text-xs text-slate-400">Your Official Examination Standing:</div>
                <div className="text-base font-bold font-mono text-amber-300 mt-0.5 flex items-center justify-center gap-2">
                  <span>Grade {activeGrade}</span>
                  <span className="text-slate-600">•</span>
                  <span>Score: {session.finalScore}/100</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                You don't get a certificate for this grade. Official Certificates of Completion are awarded exclusively to candidates achieving <strong className="text-emerald-400 font-semibold">Grade A</strong> or <strong className="text-yellow-400 font-semibold">Grade S</strong> (Score ≥ 80%).
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                {incorrectCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => { setShowCertNotice(false); handleRetakeWeakQuestions(); }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Practice Missed Questions
                  </button>
                ) : (
                  <Link
                    href="/setup"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retake Viva Exam
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowCertNotice(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Coach floating button ── */}
        <button
          onClick={() => setCoachOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-2xl shadow-indigo-900/60 transition-all hover:scale-105 active:scale-95"
        >
          🤖 <span>Ask AI Coach</span>
        </button>

        {/* ── AI Coach Drawer ── */}
        {coachOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCoachOpen(false)} />
            <div className="relative z-10 w-full max-w-md h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-lg">
                    🤖
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">AI Viva Coach</div>
                    <div className="text-[11px] text-slate-400">Post-exam intelligent academic tutor</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {coachMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCoachMessages([])}
                      title="Clear chat"
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                    >
                      Clear
                    </button>
                  )}
                  <button onClick={() => setCoachOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">✕</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {coachMessages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm mt-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-3xl mx-auto">
                      🤖
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm">Hello! I'm your AI Viva Tutor.</p>
                      <p className="text-xs text-slate-400 mt-1">I analyzed your <span className="text-indigo-300 font-medium">{session?.topic}</span> viva results. Click an option or ask anything!</p>
                    </div>
                    <div className="space-y-2 pt-2 text-left">
                      {[
                        "Why did I get missed questions wrong?",
                        "How can I improve my score to Grade S?",
                        "Explain the core concept in Question 1",
                        "Give me a 3-step study plan for this topic"
                      ].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleCoachSend(s)}
                          className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/50 hover:border-indigo-500/40 border border-slate-700/70 text-slate-300 hover:text-indigo-200 transition flex items-center justify-between group"
                        >
                          <span>{s}</span>
                          <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition">→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {coachMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-sm shadow-md whitespace-pre-wrap'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {coachLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Analyzing your answers & syllabus...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick suggestions when conversation is active */}
              {coachMessages.length > 0 && !coachLoading && (
                <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-slate-500 shrink-0">Quick:</span>
                  {["Explain Q1", "Explain Q2", "How to get Grade S?"].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleCoachSend(q)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4 border-t border-slate-800 flex gap-2 shrink-0 bg-slate-950/60">
                <input
                  type="text"
                  value={coachInput}
                  onChange={e => setCoachInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCoachSend(); }}}
                  placeholder="Ask about your answers, concepts, or score..."
                  className="flex-1 bg-slate-800 text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 outline-none focus:border-indigo-500 transition placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => handleCoachSend()}
                  disabled={coachLoading || !coachInput.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
