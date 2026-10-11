import { NextRequest, NextResponse } from "next/server";

const statsStore: Record<string, any> = {};

const BADGES = [
  { id: "first_exam",    name: "First Step",    description: "Completed your first exam",     icon: "🎯" },
  { id: "perfect_score", name: "Perfect Score", description: "Scored 100% on an exam",        icon: "💯" },
  { id: "speed_demon",   name: "Speed Demon",   description: "Finished an exam under 5 min",  icon: "⚡" },
  { id: "streak_3",      name: "On Fire",       description: "3-day practice streak",         icon: "🔥" },
  { id: "streak_7",      name: "Week Warrior",  description: "7-day practice streak",         icon: "🏆" },
  { id: "scholar",       name: "Scholar",       description: "Reached Level 5",               icon: "📚" },
  { id: "expert",        name: "Expert",        description: "Reached Level 10",              icon: "🧠" },
  { id: "consistent",    name: "Consistent",    description: "Completed 10 exams",            icon: "✅" },
  { id: "grade_s",       name: "S-Rank",        description: "Earned an S grade",             icon: "⭐" },
];

function calculateLevel(xp: number) {
  let level = 1, xpNeeded = 200, remaining = xp;
  while (remaining >= xpNeeded) { remaining -= xpNeeded; level++; xpNeeded = level * 200; }
  return { level, currentXp: remaining, nextLevelXp: xpNeeded };
}

function getLevelTitle(level: number) {
  if (level < 3) return "Novice";
  if (level < 6) return "Scholar";
  if (level < 10) return "Expert";
  if (level < 15) return "Master";
  return "Legend";
}

function getOrCreate(userId: string) {
  if (!statsStore[userId]) statsStore[userId] = { xp: 0, dailyStreak: 0, lastActiveDate: null, earnedBadgeIds: [], examCount: 0 };
  return statsStore[userId];
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "usr-alex";
  const stats = getOrCreate(userId);
  const lvl = calculateLevel(stats.xp);
  return NextResponse.json({ success: true, stats: { ...stats, ...lvl, levelTitle: getLevelTitle(lvl.level), allBadges: BADGES.map(b => ({ ...b, earned: stats.earnedBadgeIds.includes(b.id) })) } });
}

export async function POST(req: NextRequest) {
  try {
    const { userId = "usr-alex", xpGained = 0, score = 0, grade = "", examDurationMs = 0 } = await req.json();
    const stats = getOrCreate(userId);
    stats.xp += xpGained;
    stats.examCount = (stats.examCount || 0) + 1;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (stats.lastActiveDate === yesterday) stats.dailyStreak = (stats.dailyStreak || 0) + 1;
    else if (stats.lastActiveDate !== today) stats.dailyStreak = 1;
    stats.lastActiveDate = today;
    const newBadges: string[] = [];
    const earned: string[] = stats.earnedBadgeIds;
    const add = (id: string, cond: boolean) => { if (cond && !earned.includes(id)) newBadges.push(id); };
    add("first_exam", stats.examCount >= 1);
    add("perfect_score", score >= 100);
    add("speed_demon", examDurationMs > 0 && examDurationMs < 300000);
    add("streak_3", stats.dailyStreak >= 3);
    add("streak_7", stats.dailyStreak >= 7);
    add("grade_s", grade === "S");
    add("consistent", stats.examCount >= 10);
    const lvl = calculateLevel(stats.xp);
    add("scholar", lvl.level >= 5);
    add("expert", lvl.level >= 10);
    stats.earnedBadgeIds = [...earned, ...newBadges];
    return NextResponse.json({ success: true, newBadges, stats: { ...stats, ...lvl, levelTitle: getLevelTitle(lvl.level) } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
