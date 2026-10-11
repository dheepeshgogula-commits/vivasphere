import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-alex';

    const user = Storage.getUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Failed to get user profile:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, gender, dob, college, avatar, rollNumber } = body;

    const userId = id || 'usr-alex';
    let user = Storage.getUser(userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const updated = Storage.updateUser(userId, {
      name: name !== undefined ? name : user.name,
      gender: gender !== undefined ? gender : user.gender,
      dob: dob !== undefined ? dob : user.dob,
      college: college !== undefined ? college : user.college,
      avatar: avatar !== undefined ? avatar : user.avatar,
      rollNumber: rollNumber !== undefined ? rollNumber : user.rollNumber
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated
    });
  } catch (err) {
    console.error('Failed to update profile:', err);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
