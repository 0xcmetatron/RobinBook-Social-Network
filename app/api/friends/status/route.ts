import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const existing = await query<any[]>(
      `SELECT status, 
        CASE WHEN sender_id = ? THEN 'sent' ELSE 'received' END as direction
       FROM friend_requests 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
       LIMIT 1`,
      [session.userId, session.userId, targetUserId, targetUserId, session.userId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ status: 'none' });
    }

    return NextResponse.json({
      status: existing[0].status,
      direction: existing[0].direction,
    });
  } catch (error) {
    console.error('[v0] Friend status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
