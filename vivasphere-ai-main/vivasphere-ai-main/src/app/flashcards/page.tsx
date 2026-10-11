'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, XCircle, BookOpen, Loader2, Eye } from 'lucide-react';
import { InterviewSession } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';


interface Flashcard {
  question: string;
  answer: string;
  topic: string;
  type: 'MCQ' | 'WRITTEN';
}

export default function FlashcardsPage() {
  const authorized = useAuthGuard();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch('/api/user/history');
        const data = await res.json();
        if (data.success && data.sessions) {
          const allCards: Flashcard[] = [];
          (data.sessions as InterviewSession[]).forEach(session => {
            session.questions?.forEach((q, qi) => {
              const ev = session.evaluations?.[qi];
              const answer = q.type === 'MCQ'
                ? `Correct Answer: ${q.options?.[q.correctOptionIndex ?? 0] ?? 'N/A'}\n\n${q.explanation || ''}`
                : ev?.idealAnswer || q.explanation || 'See exam report for full solution.';
              allCards.push({ question: q.question, answer, topic: session.topic, type: q.type });
            });
          });
          // Deduplicate by question text
          const seen = new Set<string>();
          const unique = allCards.filter(c => {
            if (seen.has(c.question)) return false;
            seen.add(c.question);
            return true;
          });
          setCards(unique);
        }
      } catch (err) {
        console.error('Failed to load flashcards:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  const card = cards[currentIndex];

  const goNext = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.min(i + 1, cards.length - 1)), 120);
  };
  const goPrev = () => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 120);
  };
  const markKnown = () => {
    setKnown(prev => new Set([...prev, currentIndex]));
    setReview(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
    if (currentIndex < cards.length - 1) goNext();
  };
  const markReview = () => {
    setReview(prev => new Set([...prev, currentIndex]));
    setKnown(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
    if (currentIndex < cards.length - 1) goNext();
  };
  const resetAll = () => {
    setKnown(new Set());
    setReview(new Set());
    setCurrentIndex(0);
    setFlipped(false);
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Flashcards Yet</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-sm">
            Complete at least one viva exam to generate flashcards from your questions.
          </p>
          <Link href="/setup" className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition">
            Start a Viva Exam
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">

        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Spaced Repetition</span>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />Flashcard Study Deck
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review questions from all your past exams. Click card to flip. Mark what you know!
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Card <span className="text-white font-bold">{currentIndex + 1}</span> / {cards.length}</span>
          <span className="text-slate-700">•</span>
          <span className="text-emerald-400">✓ Know it: {known.size}</span>
          <span className="text-slate-700">•</span>
          <span className="text-amber-400">↩ Review: {review.size}</span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">Remaining: {cards.length - known.size}</span>
          <button onClick={resetAll} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-white transition text-[11px]">
            <RotateCcw className="w-3.5 h-3.5" /> Reset All
          </button>
        </div>

        {/* Card */}
        {card && (
          <div
            onClick={() => setFlipped(f => !f)}
            className={`relative w-full min-h-[300px] rounded-3xl border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-8 text-center shadow-2xl select-none ${
              known.has(currentIndex)
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : review.has(currentIndex)
                ? 'bg-amber-950/30 border-amber-500/30'
                : flipped
                ? 'bg-slate-900 border-indigo-500/40 shadow-indigo-500/10'
                : 'bg-slate-900 border-slate-800 hover:border-indigo-500/30'
            }`}
          >
            {/* Topic + Type badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 truncate max-w-[120px]">
                {card.topic}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                card.type === 'MCQ'
                  ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30'
                  : 'bg-purple-950/60 text-purple-300 border-purple-500/30'
              }`}>{card.type}</span>
            </div>

            {/* Flip indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Eye className="w-3.5 h-3.5" />
              {flipped ? 'ANSWER' : 'Click to flip'}
            </div>

            {/* Status badge */}
            {known.has(currentIndex) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                ✓ Know it
              </div>
            )}
            {review.has(currentIndex) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                ↩ Review
              </div>
            )}

            {/* Content */}
            {!flipped ? (
              <div className="max-w-xl">
                <div className="text-xs font-mono text-indigo-400 mb-3 uppercase tracking-wider">Question</div>
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">{card.question}</p>
              </div>
            ) : (
              <div className="max-w-xl">
                <div className="text-xs font-mono text-emerald-400 mb-3 uppercase tracking-wider">Answer / Solution</div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{card.answer}</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-5 gap-3">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <div className="flex items-center gap-3">
            <button onClick={markKnown}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white transition">
              <CheckCircle2 className="w-4 h-4" /> Know it ✓
            </button>
            <button onClick={markReview}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-white transition">
              <XCircle className="w-4 h-4" /> Review ↩
            </button>
          </div>

          <button onClick={goNext} disabled={currentIndex === cards.length - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 transition">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-indigo-500 h-full rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-slate-600 font-mono">
          <span>Start</span>
          <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
          <span>End</span>
        </div>

        {/* Link to new exam */}
        <div className="mt-8 text-center">
          <Link href="/setup" className="text-xs text-indigo-400 hover:text-indigo-300 transition font-mono underline underline-offset-2">
            + Take a new exam to add more flashcards
          </Link>
        </div>
      </main>
    </div>
  );
}
