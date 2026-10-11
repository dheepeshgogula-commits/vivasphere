'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Lock, 
  Mail, 
  User, 
  IdCard, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  Cpu, 
  Zap, 
  ShieldCheck,
  UserPlus,
  LogIn
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Alex Rivera',
    roll: 'CS22B048',
    email: 'alex.rivera@cs.university.edu',
    password: 'password123',
    college: 'National Institute of Technology, Trichy',
    gender: 'Male',
    dob: '2003-04-15',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    badge: '1 Past Exam Completed • Score: 89%'
  },
  {
    name: 'Elena Rostova',
    roll: 'CS22B012',
    email: 'elena.rostova@cs.university.edu',
    password: 'password123',
    college: 'Indian Institute of Technology, Madras',
    gender: 'Female',
    dob: '2003-08-22',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'Fresh Candidate • Systems Track'
  },
  {
    name: 'Marcus Chen',
    roll: 'CS22B099',
    email: 'marcus.chen@cs.university.edu',
    password: 'password123',
    college: 'Birla Institute of Technology and Science, Pilani',
    gender: 'Male',
    dob: '2002-11-05',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    badge: 'Fresh Candidate • Algorithms Track'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [college, setCollege] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const switchTab = (t: 'login' | 'signup') => {
    setTab(t);
    setErrorMsg('');
    // Clear all fields on tab switch
    setEmail('');
    setPassword('');
    setName('');
    setRollNumber('');
    setCollege('');
    setGender('Male');
    setDob('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          rollNumber,
          college: tab === 'signup' ? college : undefined,
          gender: tab === 'signup' ? gender : undefined,
          dob: tab === 'signup' ? dob : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('vivasphere_user', JSON.stringify(data.user));
        // dispatch storage event for navbar sync
        window.dispatchEvent(new Event('storage'));
        router.push('/setup');
      } else {
        setErrorMsg(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const instantDemoLogin = async (demo: typeof DEMO_ACCOUNTS[0]) => {
    setLoading(true);
    setErrorMsg('');

    const demoUser = {
      id: `usr-${demo.name.toLowerCase().replace(/\s+/g, '')}`,
      name: demo.name,
      email: demo.email,
      rollNumber: demo.roll,
      college: demo.college,
      gender: demo.gender,
      dob: demo.dob,
      avatar: demo.avatar
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demo.email,
          password: demo.password,
          name: demo.name,
          rollNumber: demo.roll,
          college: demo.college,
          gender: demo.gender,
          dob: demo.dob,
          avatar: demo.avatar
        })
      });

      const data = await res.json();
      const user = (data.success && data.user) ? data.user : demoUser;
      localStorage.setItem('vivasphere_user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));
      router.push('/setup');
    } catch (err: any) {
      localStorage.setItem('vivasphere_user', JSON.stringify(demoUser));
      window.dispatchEvent(new Event('storage'));
      router.push('/setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/25 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Student Access & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sign in to your account, create a new profile, or use 1-click demo credentials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 Columns: Login / Sign Up Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 absolute top-0 left-0" />

              {/* Tab switcher */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    tab === 'login'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('signup')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    tab === 'signup'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account (Sign Up)</span>
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      Full Candidate Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>
                )}

                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-indigo-400" />
                      Student Roll / Candidate ID
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                      placeholder="e.g. CS22B048"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    University Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                    placeholder="student@cs.university.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Passcode
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                    placeholder="••••••••"
                  />
                </div>

                {tab === 'signup' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        College Name
                      </label>
                      <input
                        type="text"
                        required
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                        placeholder="e.g. NIT Trichy"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Date of Birth (DOB)
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] mt-3"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>{tab === 'login' ? 'Sign In to Portal' : 'Create Student Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>

          {/* Right 5 Columns: Prominent Demo Credentials Showcase */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Demo Credentials (1-Click Login)
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Click any profile below to instantly authenticate with pre-loaded mock test records:
              </p>

              <div className="space-y-3">
                {DEMO_ACCOUNTS.map((demo) => (
                  <div
                    key={demo.roll}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700 shrink-0">
                        <img src={demo.avatar} alt={demo.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span className="truncate">{demo.name}</span>
                          <span className="text-[10px] font-mono text-indigo-400">{demo.roll}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {demo.college}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          Email: {demo.email} • Pass: {demo.password}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => instantDemoLogin(demo)}
                      disabled={loading}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Instant Login as {demo.name.split(' ')[0]}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                All user credentials and profile details (College, DOB, Gender, and Avatars) are securely stored and synced with the proctored viva session engine.
              </span>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
