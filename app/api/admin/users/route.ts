import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await query<any[]>(
      'SELECT id, username, email, full_name, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('[v0] Admin get users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}
