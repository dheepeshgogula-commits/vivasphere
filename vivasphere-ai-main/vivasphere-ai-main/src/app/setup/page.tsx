'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TutorialModal from '@/components/TutorialModal';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { 
  FileUp, 
  Settings, 
  Shield, 
  Cpu, 
  Layers, 
  Gauge, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  HelpCircle,
  FileText,
  ListFilter,
  Maximize2,
  Video,
  Link2,
  Globe,
  UploadCloud
} from 'lucide-react';
import { DifficultyLevel, QuestionMode } from '@/types';

// Custom crisp YouTube brand icon
function YoutubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function SetupContent() {
  const authorized = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTopic = searchParams ? searchParams.get('topic') : null;

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('Operating Systems');
  const [customTopic, setCustomTopic] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [questionMode, setQuestionMode] = useState<QuestionMode>('MIXED');
  const [studentName, setStudentName] = useState('Alex Rivera');
  const [studentRoll, setStudentRoll] = useState('CS22B048');
  const [userId, setUserId] = useState('usr-alex');
  
  // Drag and drop / Parsing status
  const [isParsing, setIsParsing] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{
    detectedTopic?: string;
    suggestedDifficulty?: DifficultyLevel;
    matchedConcepts?: string[];
    wordCount?: number;
  } | null>(null);

  // Pre-test proctoring acknowledgement
  const [acknowledgedProctoring, setAcknowledgedProctoring] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Onboarding Tour ──
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const TOUR_STEPS = [
    { title: '👋 Welcome to VivaSphere AI!', body: 'Your AI-powered viva exam assistant. Let me show you around in 4 quick steps.' },
    { title: '📚 Step 1: Choose Your Topic', body: 'Type any subject — Data Structures, Machine Learning, Databases — or pick from the popular chips below.' },
    { title: '⚙️ Step 2: Configure Your Exam', body: 'Set difficulty (Beginner/Intermediate/Expert), number of questions (5–20), and question type (MCQ or Written).' },
    { title: '🧪 Step 3: Study Mode (Optional)', body: 'Enable Study Mode for relaxed practice — no fullscreen lock, no anti-cheat. Answers revealed after each question.' },
    { title: '🚀 Ready to Go!', body: 'Click "Commence Viva" to start your AI-proctored exam. Good luck! 🎓' },
  ];

  useEffect(() => {
    if (queryTopic) {
      setSelectedTopic(queryTopic);
    }

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vivasphere_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.name) setStudentName(user.name);
          if (user.rollNumber) setStudentRoll(user.rollNumber);
          if (user.id) setUserId(user.id);
        } catch (e) {}
      }
      // Show onboarding tour for first-time users
      if (!localStorage.getItem('vivasphere_tour_done')) {
        setTimeout(() => setShowTour(true), 800);
      }
    }
  }, [queryTopic]);

  const topicPresets = [
    { name: 'Operating Systems', icon: Cpu, badge: 'Processes, Threads, Virtual Memory, Deadlocks' },
    { name: 'Database Management Systems', icon: Layers, badge: 'ACID, B+ Trees, 2PL, Normalization' },
    { name: 'Computer Networks', icon: Gauge, badge: 'TCP/IP, Congestion Control, BGP, Sockets' },
    { name: 'Data Structures & Algorithms', icon: Terminal, badge: 'Trees, Graphs, Sorting, Dynamic Programming' },
    { name: 'Custom Subject / Syllabus', icon: Sparkles, badge: 'Paste or upload custom syllabus/resume' }
  ];

  // Custom material input states
  const [customInputMode, setCustomInputMode] = useState<'upload' | 'youtube' | 'link' | 'text'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleUrlFetch = async (inputUrl?: string) => {
    const toFetch = (inputUrl || urlInput).trim();
    if (!toFetch) {
      setErrorMsg('Please enter a valid YouTube or Web URL.');
      return;
    }

    setIsParsing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: toFetch })
      });
      const data = await res.json();
      if (data.success) {
        setParsedInfo(data);
        if (data.text) setSyllabusText(data.text);
        if (data.detectedTopic) {
          setCustomTopic(data.detectedTopic);
        }
        if (data.suggestedDifficulty) {
          setDifficulty(data.suggestedDifficulty);
        }
      } else {
        setErrorMsg(data.error || 'Failed to fetch content from the link.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to link.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsing(true);
    setErrorMsg('');

    try {
      const text = await file.text();
      setSyllabusText(text);

      const res = await fetch('/api/parse-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 5000) })
      });

      const data = await res.json();
      if (data.success) {
        setParsedInfo(data);
        if (data.detectedTopic) {
          if (selectedTopic === 'Custom Subject / Syllabus') {
            setCustomTopic(data.detectedTopic);
          } else {
            setSelectedTopic(data.detectedTopic);
          }
        }
        if (data.suggestedDifficulty) {
          setDifficulty(data.suggestedDifficulty);
        }
      }
    } catch (err) {
      console.error('Failed to read file:', err);
      setErrorMsg('Could not parse the uploaded file. Please paste syllabus text manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartViva = async () => {
    if (!acknowledgedProctoring) {
      setErrorMsg('You must acknowledge the Anti-Cheat Proctoring rules to commence.');
      return;
    }

    const effectiveTopic = selectedTopic === 'Custom Subject / Syllabus' 
      ? (customTopic.trim() || parsedInfo?.detectedTopic || 'Custom Technical Viva') 
      : selectedTopic;

    setIsLaunching(true);
    setErrorMsg('');

    // Attempt fullscreen only in normal mode
    if (!studyMode && typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn('Fullscreen permission deferred:', err);
      }
    }

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: effectiveTopic,
          difficulty,
          totalQuestions: questionCount,
          questionMode,
          studyMode,
          syllabusExcerpt: syllabusText.substring(0, 4000),
          userName: `${studentName} (${studentRoll})`,
          userEmail: 'student@cs.university.edu',
          userId
        })
      });

      const data = await response.json();
      if (data.success && data.session?.id) {
        router.push(`/interview/${data.session.id}`);
      } else {
        throw new Error(data.error || 'Failed to initialize session');
      }
    } catch (err: any) {
      console.error('Launch error:', err);
      setErrorMsg(err.message || 'Error launching examination session. Please try again.');
      setIsLaunching(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar onOpenTutorial={() => setIsTutorialOpen(true)} />

      <TutorialModal 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Viva Voce Configurator</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Configure Your Technical Examination
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Configure CS topic, choose between Multiple Choice & Written bits, and lock into automatic full-screen proctoring.
              </p>
            </div>

            <button
              onClick={() => setIsTutorialOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Proctoring Instructions
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Configurator */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Subject / Domain Selector */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                1. Select Subject or Domain
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {topicPresets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedTopic === preset.name;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSelectedTopic(preset.name);
                        setParsedInfo(null);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-semibold text-white">{preset.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {preset.badge}
                      </p>
                    </button>
                  );
                })}
              </div>

              {selectedTopic === 'Custom Subject / Syllabus' && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                  {/* Topic / Subject Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-200">
                        Custom Subject / Topic Title
                      </label>
                      <span className="text-[10px] text-indigo-400 font-mono">Auto-filled from your source</span>
                    </div>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g. Distributed Consensus (Raft/Paxos), Compiler Optimizations, Neural Architecture"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-medium"
                    />
                    {/* Quick-Pick Popular Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-slate-500 font-mono">Popular:</span>
                      {[
                        'Distributed Systems (Raft)',
                        'Transformers & Attention',
                        'Compiler Design & ASTs',
                        'Kubernetes & Containers',
                        'Cryptography & Zero Knowledge'
                      ].map((topicName) => (
                        <button
                          key={topicName}
                          type="button"
                          onClick={() => setCustomTopic(topicName)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/30 text-slate-400 hover:text-indigo-200 transition"
                        >
                          + {topicName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Upload Files, Video, or Reference Links
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'upload', label: 'Upload File', icon: UploadCloud, desc: 'PDF, TXT, MD' },
                        { id: 'youtube', label: 'YouTube Video', icon: YoutubeIcon, desc: 'Lecture URL' },
                        { id: 'link', label: 'Web / PDF Link', icon: Link2, desc: 'Online resource' },
                        { id: 'text', label: 'Paste Notes', icon: FileText, desc: 'Direct text' },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isCurrent = customInputMode === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setCustomInputMode(tab.id as any)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-start gap-1 ${
                              isCurrent
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-600/20'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
                              <span>{tab.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 leading-none">{tab.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode 1: File Upload */}
                  {customInputMode === 'upload' && (
                    <div className="relative border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-5 text-center transition-all bg-slate-950/40">
                      <input
                        type="file"
                        accept=".txt,.pdf,.md,.doc,.docx,.json"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isParsing}
                      />
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1.5">
                          {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                        </div>
                        <p className="text-xs font-medium text-slate-200">
                          {isParsing ? 'Extracting topics and concepts from file...' : uploadedFileName ? `Active: ${uploadedFileName}` : 'Click or drop PDF, TXT, or MD syllabus file'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Questions will be generated specifically from this uploaded file
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: YouTube Link */}
                  {customInputMode === 'youtube' && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <YoutubeIcon className="w-4 h-4 text-rose-500" />
                        Enter YouTube Video Lecture URL
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleUrlFetch()}
                          disabled={isParsing || !urlInput.trim()}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
                        >
                          {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>Fetch Lecture</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Extracts the lecture title and key algorithms, generating examination questions directly from this video.
                      </p>
                    </div>
                  )}

                  {/* Mode 3: Web / PDF Link */}
                  {customInputMode === 'link' && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        Enter Web URL, Documentation, or Online PDF Link
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://en.wikipedia.org/wiki/... or https://domain.com/notes.pdf"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleUrlFetch()}
                          disabled={isParsing || !urlInput.trim()}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
                        >
                          {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          <span>Fetch Link</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Crawls the content, extracts definitions and invariants, and targets exam questions directly to this document.
                      </p>
                    </div>
                  )}

                  {/* Mode 4: Paste Notes */}
                  {customInputMode === 'text' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Paste Syllabus Modules, Chapter Notes, or Questions
                      </label>
                      <textarea
                        rows={3}
                        value={syllabusText}
                        onChange={(e) => setSyllabusText(e.target.value)}
                        placeholder="Paste syllabus modules (e.g. Unit 4: Distributed Storage - Replication, Raft Consensus, Quorums, Linearizability...)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none font-mono"
                      />
                    </div>
                  )}

                  {/* Parsed Info Feedback Display */}
                  {parsedInfo && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Source Material Successfully Indexed
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{parsedInfo.wordCount} words scanned</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Exam Topic: <span className="text-white font-bold">{customTopic || parsedInfo.detectedTopic}</span>
                      </div>
                      {parsedInfo.matchedConcepts && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {parsedInfo.matchedConcepts.slice(0, 10).map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-200 border border-indigo-700/40 font-mono">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Question Format: MCQ vs Written Bits */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-indigo-400" />
                2. Question Format & Bits Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    mode: 'MIXED',
                    title: 'Hybrid Bits',
                    desc: 'Alternating Multiple Choice (MCQs) & Written Viva'
                  },
                  {
                    mode: 'MCQ_ONLY',
                    title: 'Multiple Choice Only',
                    desc: '4-Option technical bits with immediate key scoring'
                  },
                  {
                    mode: 'WRITTEN_ONLY',
                    title: 'Written Viva Only',
                    desc: 'Oral speech / typing evaluated by AI Professor'
                  }
                ].map((item) => {
                  const isSelected = questionMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setQuestionMode(item.mode as QuestionMode)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">{item.title}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Difficulty Level & Question Count */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                3. Difficulty Baseline & Questions
              </h2>

              {/* Difficulty selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Initial Difficulty Tier (Adaptive difficulty will adjust this during viva):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Beginner', 'Intermediate', 'Expert'] as DifficultyLevel[]).map((level) => {
                    const isSelected = difficulty === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/25'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">{level}</div>
                        <div className="text-[10px] mt-0.5 opacity-80">
                          {level === 'Beginner' ? 'Definitions & Core' : level === 'Intermediate' ? 'Mechanisms & Tradeoffs' : 'Kernel & Concurrency'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question count selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-300">
                    Viva Question Count:
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400">{questionCount} Questions</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 4, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition ${
                        questionCount === count
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {count === 3 ? '3 (Quick Viva)' : count === 4 ? '4 (Standard Exam)' : '6 (Defense Mode)'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right 1 Column: Student Profile & Proctoring Verification */}
          <div className="space-y-6">
            
            {/* Student Info Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Candidate Profile
                </h3>
                <Link href="/login" className="text-[11px] text-indigo-400 hover:underline">
                  Switch Account
                </Link>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Roll / Candidate Number</label>
                  <input
                    type="text"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Auto Full-Screen Notice */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
              <Maximize2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Automatic Full-Screen Lockdown
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Upon clicking "Commence Viva Voce", the browser will automatically enter <strong>Full-Screen Mode</strong>. Exiting full-screen triggers an anti-cheat proctor alert.
                </p>
              </div>
            </div>

            {/* Study Mode Toggle */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <button
                type="button"
                onClick={() => setStudyMode(m => !m)}
                className="w-full flex items-center gap-3 cursor-pointer text-left"
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${studyMode ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${studyMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">🧪 Study Mode</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">No fullscreen lock, no anti-cheat. Correct answers shown after each question.</div>
                </div>
              </button>
            </div>

            {/* Anti-Cheat Proctoring Rules Warning */}
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400 mb-3">
                <Shield className="w-5 h-5 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Proctoring Protocol
                </h3>
              </div>

              <ul className="text-[11px] text-rose-200/80 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Focus Detection:</strong> Switching tabs or exiting fullscreen triggers a <strong>3-second termination countdown</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Immediate Auto-Submit:</strong> Scores recorded up to the point of breach are submitted with integrity penalties.</span>
                </li>
              </ul>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-rose-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedProctoring}
                  onChange={(e) => setAcknowledgedProctoring(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-300 leading-snug">
                  I agree to keep the examination in full-screen and focused.
                </span>
              </label>
            </div>

            {/* Launch Examination CTA */}
            <button
              onClick={handleStartViva}
              disabled={isLaunching || !acknowledgedProctoring}
              className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isLaunching || !acknowledgedProctoring
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Entering Locked Viva Chamber...</span>
                </>
              ) : (
                <>
                  <span>Commence Viva Voce Exam</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </div>

        </div>

        {/* ── Onboarding Tour ── */}
        {showTour && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl shadow-indigo-900/50 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold text-base">{TOUR_STEPS[tourStep].title}</h3>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{TOUR_STEPS[tourStep].body}</p>
                </div>
                <button
                  onClick={() => { setShowTour(false); localStorage.setItem('vivasphere_tour_done', '1'); }}
                  className="text-slate-500 hover:text-white ml-3 flex-shrink-0 p-1"
                >✕</button>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === tourStep ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-700'}`} />
                ))}
              </div>
              <div className="flex gap-2">
                {tourStep > 0 && (
                  <button onClick={() => setTourStep(t => t - 1)}
                    className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition">
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (tourStep < TOUR_STEPS.length - 1) { setTourStep(t => t + 1); }
                    else { setShowTour(false); localStorage.setItem('vivasphere_tour_done', '1'); }
                  }}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
                >{tourStep < TOUR_STEPS.length - 1 ? 'Next →' : "🚀 Let's Start!"}</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
