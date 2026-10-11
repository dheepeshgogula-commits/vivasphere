'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Navbar from '@/components/Navbar';

import { 
  User, 
  Mail, 
  Building2, 
  Calendar, 
  Check, 
  Save, 
  Loader2, 
  Camera, 
  IdCard,
  GraduationCap,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
];

export default function ProfilePage() {
  const authorized = useAuthGuard();
  const [userId, setUserId] = useState('usr-alex');
  const [name, setName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex.rivera@cs.university.edu');
  const [rollNumber, setRollNumber] = useState('CS22B048');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Prefer not to say'>('Male');
  const [dob, setDob] = useState('2003-04-15');
  const [college, setCollege] = useState('National Institute of Technology, Trichy');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  // uploadedPhoto = base64 data URL of user-chosen file
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [userStats, setUserStats] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── active display source (uploaded photo wins over preset) ──
  const activeAvatar = uploadedPhoto || avatar;

  useEffect(() => {
    async function loadProfile() {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('vivasphere_user');
        let currentId = 'usr-alex';
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.id) currentId = parsed.id;
          } catch (e) {}
        }

        try {
          const res = await fetch(`/api/user/profile?userId=${currentId}`);
          const data = await res.json();
          if (data.success && data.user) {
            setUserId(data.user.id);
            setName(data.user.name || 'Alex Rivera');
            setEmail(data.user.email || 'alex.rivera@cs.university.edu');
            setRollNumber(data.user.rollNumber || 'CS22B048');
            if (data.user.gender) setGender(data.user.gender);
            if (data.user.dob) setDob(data.user.dob);
            if (data.user.college) setCollege(data.user.college);
            if (data.user.avatar) {
              // If saved avatar is a data URL (uploaded photo), restore it
              if (data.user.avatar.startsWith('data:')) {
                setUploadedPhoto(data.user.avatar);
              } else {
                setAvatar(data.user.avatar);
              }
            }
          }
        } catch (err) {
          console.error('Error loading profile:', err);
        }
        // Fetch gamification stats
        try {
          const sRes = await fetch(`/api/user/stats?userId=${currentId}`);
          const sData = await sRes.json();
          if (sData.success) setUserStats(sData.stats);
        } catch (e) {}
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // ── Handle file chosen via input or drop ──
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5 MB.');
      return;
    }
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadedPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so same file can be re-chosen
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name,
          rollNumber,
          gender,
          dob,
          college,
          avatar: activeAvatar
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMsg('Candidate profile updated successfully!');
        // Sync localStorage so Navbar updates immediately
        localStorage.setItem('vivasphere_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Academic Credentials</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
            Candidate Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Update your profile picture, personal details, date of birth, and engineering college information.
          </p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* ── 1. Profile Picture ── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                1. Candidate Profile Picture
              </h2>
              <span className="text-[11px] text-slate-400">Displayed in Proctor & Transcripts</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/15 ring-4 ring-indigo-500/10">
                  <img
                    src={activeAvatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = AVATAR_PRESETS[0];
                    }}
                  />
                </div>
                {/* Camera overlay click */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Upload photo"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Right panel */}
              <div className="flex-1 w-full space-y-4">

                {/* ── File Upload Drop Zone ── */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    Upload Your Own Photo
                    <span className="text-slate-500 font-normal">(JPG / PNG / WEBP · max 5 MB)</span>
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center gap-2 w-full py-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                        : 'border-slate-700 hover:border-indigo-500/60 hover:bg-slate-800/40 bg-slate-950/60'
                    }`}
                  >
                    {uploadedPhoto ? (
                      <>
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-indigo-500/50">
                          <img src={uploadedPhoto} alt="Uploaded" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold">Photo uploaded ✓</span>
                        <span className="text-[11px] text-slate-500">Click to replace</span>

                        {/* Remove uploaded photo button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedPhoto(null);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-400 transition"
                          title="Remove uploaded photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-7 h-7 text-slate-500" />
                        <span className="text-xs text-slate-400">
                          <span className="text-indigo-400 font-semibold">Click to browse</span> or drag & drop your photo here
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* ── OR Preset Avatars ── */}
                {!uploadedPhoto && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Or choose from preset avatars:
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {AVATAR_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(p)}
                          className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                            avatar === p
                              ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                              : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={p} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. Candidate Academic & Personal Information ── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              2. Candidate & Academic Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Full Name */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Roll Number */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              {/* University Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  University Email
                </label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Gender Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Date of Birth */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              {/* College */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  College / Engineering Institute
                </label>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. National Institute of Technology, Trichy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-7 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition hover:scale-105 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* ── XP / Level / Badges Card ── */}
        {userStats && (
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-700/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">Level {userStats.level}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">{userStats.levelTitle}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{userStats.currentXp} / {userStats.nextLevelXp} XP to Level {userStats.level + 1}</p>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-bold text-lg">🔥 {userStats.dailyStreak} day streak</div>
                <div className="text-xs text-slate-400">{userStats.examCount || 0} exams completed</div>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (userStats.currentXp / userStats.nextLevelXp) * 100)}%` }}
              />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Achievements</h3>
              <div className="grid grid-cols-3 gap-3">
                {userStats.allBadges?.map((badge: any) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${badge.earned ? 'bg-indigo-900/40 border-indigo-600/50' : 'bg-slate-900/40 border-slate-800 opacity-40 grayscale'}`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[10px] font-bold text-white leading-tight">{badge.name}</span>
                    <span className="text-[9px] text-slate-400 leading-tight">{badge.description}</span>
                    {badge.earned && <span className="text-[9px] text-green-400 font-semibold">✓ Earned</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
