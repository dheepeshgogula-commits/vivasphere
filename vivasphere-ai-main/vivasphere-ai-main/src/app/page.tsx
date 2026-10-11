'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TutorialModal from '@/components/TutorialModal';
import { 
  ArrowRight, 
  HelpCircle,
  ShieldCheck, 
  Brain, 
  Gauge, 
  FileText, 
  Cpu, 
  Layers, 
  Sparkles, 
  Zap, 
  Award,
  Terminal,
  FileCheck,
  BookOpen,
  Timer,
  Flame,
  Mic,
  BarChart3,
  BrainCircuit,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const subjects = [
    { name: 'Operating Systems',           desc: 'Process sync, Virtual memory, Paging, TLB, Deadlocks',  icon: Cpu,      color: 'text-blue-400',    glow: 'from-blue-600/20 to-transparent',   border: 'border-blue-500/20'   },
    { name: 'Database Management',         desc: 'ACID, B+ Trees, Concurrency, Strict 2PL, Indexing',     icon: Layers,   color: 'text-emerald-400', glow: 'from-emerald-600/20 to-transparent', border: 'border-emerald-500/20' },
    { name: 'Computer Networks',           desc: 'TCP Handshake, BGP, Congestion control, OSI layers',    icon: Gauge,    color: 'text-purple-400',  glow: 'from-purple-600/20 to-transparent',  border: 'border-purple-500/20'  },
    { name: 'Data Structures & Algorithms', desc: 'Trees, Graphs, Dynamic programming, Complexity',      icon: Terminal, color: 'text-amber-400',   glow: 'from-amber-600/20 to-transparent',   border: 'border-amber-500/20'   },
  ];

  const features = [
    { icon: Brain,      title: 'Adaptive Difficulty',    desc: 'Questions scale Beginner → Expert in real time based on your answer quality.',    badge: 'AI-Powered'        },
    { icon: ShieldCheck,title: 'Anti-Cheat Proctor',     desc: 'Tab-switch & blur detection with 3-second countdown auto-submit on breach.',       badge: 'Zero Compromise'   },
    { icon: Award,      title: '4-Axis Rubric Grading',  desc: 'Scores across Conceptual Clarity, Technical Depth, Terminology & Application.',   badge: 'University Grade'  },
    { icon: FileCheck,  title: 'PDF & Certificate',      desc: 'Download official PDF reports + achievement certificates with grade and score.',   badge: 'Instant Export'    },
    { icon: Timer,      title: 'Question Timer',         desc: '90-second countdown per question with auto-submit on expiry, just like real exams.', badge: 'Exam Simulation'  },
    { icon: Flame,      title: 'Streak Counter',         desc: 'Tracks consecutive correct answers with live fire badge — stay in the zone.',      badge: 'Gamified'          },
    { icon: Mic,        title: 'Voice Input',            desc: 'Speak your answers using the browser microphone — transcribed automatically.',     badge: 'Hands-Free'        },
    { icon: BookOpen,   title: 'Flashcard Deck',         desc: 'Review all past exam questions as flip-cards with Know It / Review Again tracking.', badge: 'Spaced Repetition' },
  ];

  const stats = [
    { value: '4+',       label: 'CS Subjects',       color: 'text-white'        },
    { value: 'Real-Time',label: 'Adaptive AI',        color: 'text-indigo-400'   },
    { value: '5-Axis',   label: 'Radar Analytics',   color: 'text-purple-400'   },
    { value: '100%',     label: 'Auto-Proctored',    color: 'text-emerald-400'  },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar onOpenTutorial={() => setIsTutorialOpen(true)} />
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      <main className="flex-1">

        {/* ══ HERO ══ */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full" />
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-violet-600/8 blur-[100px] rounded-full" />
            <div className="absolute top-1/4 right-1/4 w-[300px] h-[200px] bg-blue-600/6 blur-[80px] rounded-full" />
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI-Powered Viva Voce & Technical Interview Simulator
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Ace Your CS Viva with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Adaptive AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto font-normal">
              A strict AI professor evaluates your answers in real time, scales difficulty dynamically, 
              and enforces proctoring — giving you an authentic exam experience before the real thing.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Link href="/setup"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Zap className="w-4 h-4" />
                Launch Simulator
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button type="button" onClick={() => setIsTutorialOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] hover:border-white/[0.14] transition-all">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                How it works
              </button>
            </div>

            {/* Stats bar */}
            <div className="inline-flex items-center gap-0 rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
              {stats.map((s, i) => (
                <div key={i} className="px-6 py-4 text-center border-r border-white/[0.07] last:border-r-0">
                  <div className={`text-lg font-black font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="py-20 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-2">Platform Capabilities</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Everything you need to prepare
              </h2>
              <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">
                Built to emulate university oral examinations and FAANG-style technical interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i}
                    className="group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all cursor-default">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-500/15 transition-all">
                        <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                      </div>
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-500 border border-white/[0.07]">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ SUBJECTS ══ */}
        <section className="py-20 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-1">Curriculum</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Curated Subject Domains</h2>
                <p className="text-sm text-slate-400 mt-1.5">4 ready-to-test CS subjects — or upload any custom syllabus.</p>
              </div>
              <Link href="/setup" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition shrink-0">
                Upload custom syllabus <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Link key={i} href={`/setup?topic=${encodeURIComponent(s.name)}`}
                    className={`group p-5 rounded-2xl bg-white/[0.02] border ${s.border} hover:bg-white/[0.04] hover:border-opacity-60 transition-all block`}>
                    <div className={`w-9 h-9 rounded-xl border ${s.border} bg-gradient-to-br ${s.glow} flex items-center justify-center mb-4`}>
                      <Icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: 18, height: 18 }} />
                    </div>
                    <h3 className={`text-sm font-semibold text-white mb-1.5 group-hover:${s.color} transition-colors`}>{s.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                    <div className={`mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-600 group-hover:${s.color} transition-colors`}>
                      <span>Start Exam</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ CTA BANNER ══ */}
        <section className="py-20 border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="relative p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-violet-950/40 to-slate-950 border border-indigo-500/20 overflow-hidden">
              {/* inner glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[200px] bg-indigo-600/10 blur-[80px] rounded-full" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                  <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
                  Ready to test your knowledge?
                </h3>
                <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                  Start a simulated oral exam now. Adaptive difficulty, real-time evaluation, 
                  strict anti-cheat — everything a real viva demands.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/setup"
                    className="group w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                    Begin Viva Voce <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <button onClick={() => setIsTutorialOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition flex items-center justify-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    View Proctoring Rules
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-slate-950/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-400">VivaSphere AI</span>
            <span>— Technical Viva Simulator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/setup" className="hover:text-slate-400 transition">New Exam</Link>
            <Link href="/history" className="hover:text-slate-400 transition">History</Link>
            <Link href="/flashcards" className="hover:text-slate-400 transition">Flashcards</Link>
            <Link href="/login" className="hover:text-slate-400 transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
