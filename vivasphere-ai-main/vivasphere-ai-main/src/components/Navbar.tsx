'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BrainCircuit,
  HelpCircle, 
  PlusCircle, 
  History, 
  User, 
  LogIn, 
  LogOut, 
  Zap,
  AlertTriangle,
  X,
  BookOpen,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { User as UserType } from '@/types';

interface NavbarProps {
  onOpenTutorial?: () => void;
}

const navItems = [
  { href: '/',           label: 'Home',       icon: LayoutDashboard },
  { href: '/setup',      label: 'New Exam',   icon: PlusCircle      },
  { href: '/history',    label: 'History',    icon: History         },
  { href: '/flashcards', label: 'Flashcards', icon: BookOpen        },
  { href: '/profile',    label: 'Profile',    icon: User            },
];

export default function Navbar({ onOpenTutorial }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isInterview = pathname?.startsWith('/interview');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const syncUser = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vivasphere_user');
      if (stored) {
        try { setCurrentUser(JSON.parse(stored)); } catch (e) { setCurrentUser(null); }
      } else { setCurrentUser(null); }
    }
  };

  // ── Theme ──
  const [theme, setTheme] = React.useState<'dark'|'light'>('dark');
  React.useEffect(() => {
    const stored = (localStorage.getItem('vivasphere_theme') as 'dark'|'light') || 'dark';
    setTheme(stored);
  }, []);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('vivasphere_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const handleQuickDemoLogin = async () => {
    const demoUser = {
      id: 'usr-alex',
      email: 'alex.rivera@cs.university.edu',
      name: 'Alex Rivera',
      rollNumber: 'CS22B048',
      college: 'National Institute of Technology, Trichy',
      gender: 'Male',
      dob: '2003-04-15',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...demoUser, password: 'password123' })
      });
      const data = await res.json();
      const user = (data.success && data.user) ? data.user : demoUser;
      localStorage.setItem('vivasphere_user', JSON.stringify(user));
      setCurrentUser(user);
      window.dispatchEvent(new Event('storage'));
      if (pathname === '/login') router.push('/setup');
    } catch (err) {
      localStorage.setItem('vivasphere_user', JSON.stringify(demoUser));
      setCurrentUser(demoUser as any);
      window.dispatchEvent(new Event('storage'));
      if (pathname === '/login') router.push('/setup');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vivasphere_user');
    setCurrentUser(null);
    setShowLogoutConfirm(false);
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#07090e]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

          {/* ── Brand ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
              <BrainCircuit className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div className="hidden sm:flex items-baseline gap-1.5">
              <span className="font-bold text-[15px] tracking-tight text-white">VivaSphere</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">AI</span>
            </div>
          </Link>

          {/* ── Centre Nav ── (hidden on interview pages) */}
          {!isInterview && (
            <nav className="hidden md:flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] p-1 rounded-xl">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* ── Proctor badge (interview only) ── */}
          {isInterview && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <ShieldCheck className="w-3.5 h-3.5" />
              AI Proctor Active
            </div>
          )}

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-2 shrink-0">

            {!isInterview && (
              <Link href="/setup"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Zap className="w-3.5 h-3.5" />
                Start Exam
              </Link>
            )}

            {/* Tutorial */}
            {!isInterview && (
              <button type="button" onClick={onOpenTutorial} title="How to use"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition">
                <HelpCircle className="w-4 h-4" />
              </button>
            )}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition text-sm"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Auth */}
            {!currentUser ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
                <button type="button" onClick={handleQuickDemoLogin} title="1-click demo login"
                  className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-violet-300 text-[11px] font-semibold transition">
                  <Zap className="w-3 h-3" /> Demo
                </button>
                <Link href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-semibold text-slate-300 hover:text-white transition">
                  <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                <Link href="/profile" className="flex items-center gap-2 group" title="View profile">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-400 flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all shrink-0">
                    {currentUser.avatar
                      ? <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      : currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:block text-xs font-medium text-slate-300 group-hover:text-indigo-300 transition max-w-[96px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </Link>
                <button type="button" onClick={() => setShowLogoutConfirm(true)} title="Log out"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-slate-900/95 border border-white/[0.08] shadow-2xl p-6">
            <button type="button" onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/25 mx-auto mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-white text-center mb-1">Confirm Logout</h3>
            <p className="text-xs text-slate-400 text-center mb-5 leading-relaxed">
              You'll be signed out and redirected to the login page.
            </p>
            {currentUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] mb-5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {currentUser.avatar
                    ? <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    : currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                </div>
              </div>
            )}
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 hover:text-white border border-white/[0.08] transition">
                Stay Logged In
              </button>
              <button type="button" onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition">
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
