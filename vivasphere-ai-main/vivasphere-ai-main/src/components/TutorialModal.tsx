'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  FileUp, 
  Mic, 
  BrainCircuit, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'step-upload',
      title: '1. Configure Topics or Upload Syllabus',
      subtitle: 'Targeted evaluation tailored to your engineering curriculum',
      icon: FileUp,
      badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            VivaSphere AI analyzes your specific course syllabus, project resume, or chosen CS domain (such as <span className="text-indigo-300 font-semibold">Operating Systems</span>, <span className="text-purple-300 font-semibold">Computer Networks</span>, or <span className="text-blue-300 font-semibold">DBMS</span>).
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Supported Input Methods
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>Drag & Drop PDF/TXT file of your semester syllabus or resume</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>One-click CS standard presets (OS, DSA, DBMS, System Design)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Select initial test baseline: Beginner, Intermediate, or Expert</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'step-answering',
      title: '2. Viva Voce Verbal & Text Articulation',
      subtitle: 'Communicate your technical thoughts with architectural clarity',
      icon: Mic,
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            The AI Examiner asks rigorous oral viva questions. You can answer using <span className="text-emerald-300 font-semibold">Voice Dictation (Speech-to-Text)</span> or by typing in the proctored terminal.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-semibold text-emerald-400 mb-1">✓ What Scores High</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Precise technical terms (e.g., TLB miss, Coffman conditions, ACID, 2PL), memory diagrams, time/space tradeoffs.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-semibold text-rose-400 mb-1">✗ What Penalizes</div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Vague colloquial descriptions, avoiding edge-cases, circular definitions without underlying mechanism.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'step-adaptive',
      title: '3. Real-Time Adaptive Difficulty Engine',
      subtitle: 'Dynamic difficulty scaling shifts the next question in real-time',
      icon: BrainCircuit,
      badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            VivaSphere AI evaluates each answer on the spot. If you articulate an answer with deep theoretical precision, the AI elevates the next question to stress-test your mastery.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400">Answer Score &gt;= 80%</span>
              <span className="text-slate-400">→ Dynamic Level Up (Intermediate to Expert)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400">Answer Score 55% - 79%</span>
              <span className="text-slate-400">→ Steady-State Probe (Deepen focus area)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400">Answer Score &lt; 50%</span>
              <span className="text-slate-400">→ Scaffold Down (Re-verify core fundamentals)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'step-proctor',
      title: '4. Anti-Cheat & Academic Integrity Shield',
      subtitle: 'Strict automated proctoring with 3-second penalty auto-submit',
      icon: ShieldAlert,
      badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            To ensure genuine technical capability without search engine assistance, the viva environment enforces <span className="text-rose-300 font-semibold">Strict Proctoring</span>.
          </p>
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Anti-Cheat Protocol
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              If you switch tabs, minimize the browser, or lose focus, a critical alarm countdown starts for <span className="font-bold underline">3 seconds</span>. If focus is not instantly restored, the session terminates, grades are penalized, and an integrity violation is logged in your official report.
            </p>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Top glowing accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${current.badgeColor}`}>
                <StepIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {current.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {current.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {current.content}
          </div>

          {/* Stepper Dots & Navigation Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 border-t border-slate-800/80">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-6 bg-indigo-500'
                      : idx < currentStep
                      ? 'w-2 bg-indigo-400/50'
                      : 'w-2 bg-slate-700'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/setup"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/30"
                >
                  Configure My Viva
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
