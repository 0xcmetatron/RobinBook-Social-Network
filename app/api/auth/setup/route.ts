import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// This endpoint ensures the admin user exists with a properly hashed password.
// It is safe to call multiple times (idempotent).
export async function GET() {
  try {
    // Check if admin already exists
    const existing = await query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      ['admin@admin.com']
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Admin already exists', adminId: existing[0].id });
    }

    // Hash the password at runtime so bcrypt produces a valid hash
    const hashedPassword = await hashPassword('Alex159@');

    await query(
      'INSERT INTO users (email, username, password, full_name, is_admin) VALUES (?, ?, ?, ?, 1)',
      ['admin@admin.com', 'admin', hashedPassword, 'Administrator']
    );

    return NextResponse.json({ message: 'Admin user created successfully' });
  } catch (error) {
    console.error('[v0] Setup admin error:', error);
    return NextResponse.json(
      { error: 'Failed to setup admin user' },
      { status: 500 }
    );
  }
}
