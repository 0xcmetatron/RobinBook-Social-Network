import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const posts = await query<any[]>(
      `SELECT p.*, u.username FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 100`
    );

    return NextResponse.json(posts);
  } catch (error) {
    console.error('[v0] Admin get posts error:', error);
    return NextResponse.json({ error: 'Failed to get posts' }, { status: 500 });
  }
}
