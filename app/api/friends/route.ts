import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const friends = await query<any[]>(`
      SELECT u.id, u.username, u.full_name, u.profile_image
      FROM friend_requests f
      JOIN users u ON (CASE WHEN f.sender_id = ? THEN f.receiver_id ELSE f.sender_id END) = u.id
      WHERE (f.sender_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'
      ORDER BY u.username ASC
    `, [session.userId, session.userId, session.userId]);

    return NextResponse.json(friends);
  } catch (error) {
    console.error('[v0] Get friends error:', error);
    return NextResponse.json({ error: 'Failed to get friends' }, { status: 500 });
  }
}
