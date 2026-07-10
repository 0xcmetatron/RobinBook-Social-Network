import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { rateLimiter, getClientIp, sanitizeUsername, validateEmail, validatePassword, containsBlockedWords, getSecuritySettings } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rlKey = `register:${ip}`;
    const rlCheck = rateLimiter(rlKey, 3, 60000);
    if (!rlCheck.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Try again in ${Math.ceil(rlCheck.remaining / 1000)}s.` },
        { status: 429 }
      );
    }

    const { username, email, password, full_name } = await request.json();

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    const sanitizedUsername = sanitizeUsername(username);
    if (sanitizedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      return NextResponse.json({ error: pwValidation.message }, { status: 400 });
    }

    const isBlocked = await containsBlockedWords(sanitizedUsername + ' ' + (full_name || ''));
    if (isBlocked) {
      return NextResponse.json({ error: 'Username contains inappropriate content' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await query<any[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await query<any>(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name || null]
    );

    const userId = result.insertId;

    // Create token
    const token = await createToken(userId, false);
    await setAuthCookie(token);

    return NextResponse.json(
      { success: true, userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Register error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
