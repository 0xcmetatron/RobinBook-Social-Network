import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const comments = await query<any[]>(
      `SELECT c.*, u.username FROM comments c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.created_at DESC LIMIT 100`
    );

    return NextResponse.json(comments);
  } catch (error) {
    console.error('[v0] Admin get comments error:', error);
    return NextResponse.json({ error: 'Failed to get comments' }, { status: 500 });
  }
}
