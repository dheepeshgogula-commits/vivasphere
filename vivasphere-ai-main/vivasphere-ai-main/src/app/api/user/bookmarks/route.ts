import { NextRequest, NextResponse } from "next/server";

const bookmarks: Record<string, Record<string, number[]>> = {};

function getUser(userId: string) {
  if (!bookmarks[userId]) bookmarks[userId] = {};
  return bookmarks[userId];
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "usr-alex";
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const user = getUser(userId);
  if (sessionId) return NextResponse.json({ success: true, bookmarks: user[sessionId] || [] });
  return NextResponse.json({ success: true, bookmarks: user });
}

export async function POST(req: NextRequest) {
  try {
    const { userId = "usr-alex", sessionId, questionIndex } = await req.json();
    const user = getUser(userId);
    if (!user[sessionId]) user[sessionId] = [];
    const idx = user[sessionId].indexOf(questionIndex);
    let action: string;
    if (idx >= 0) { user[sessionId].splice(idx, 1); action = "removed"; }
    else { user[sessionId].push(questionIndex); action = "added"; }
    return NextResponse.json({ success: true, action, bookmarks: user[sessionId] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
