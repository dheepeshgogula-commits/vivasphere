import { NextResponse } from 'next/server';
import { Storage } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, rollNumber, name, college, gender, dob, avatar } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    let user = Storage.getUserByEmail(email);

    if (!user) {
      // Create new student account if not found
      user = Storage.saveUser({
        id: `usr-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        rollNumber: rollNumber || `CS-${Math.floor(1000 + Math.random() * 9000)}`,
        password: password || 'password123',
        college: college || 'National Institute of Technology',
        gender: gender || 'Prefer not to say',
        dob: dob || '2003-01-01',
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        college: user.college,
        gender: user.gender,
        dob: user.dob,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
