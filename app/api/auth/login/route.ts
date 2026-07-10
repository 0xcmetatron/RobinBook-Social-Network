import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { rateLimiter, getClientIp, getSecuritySettings } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const settings = await getSecuritySettings();

    const maxAttempts = settings?.maxLoginAttempts || 5;
    const windowMs = 60000;
    const rlKey = `login:${ip}`;
    const rlCheck = rateLimiter(rlKey, maxAttempts, windowMs);
    if (!rlCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(rlCheck.remaining / 1000)}s.` },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const users = await query<any[]>(
      'SELECT id, username, email, password, is_admin FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create token
    const isAdmin = user.is_admin === 1 || user.is_admin === true;
    const token = await createToken(user.id, isAdmin);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin,
      },
    });
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
