import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug } = await params;
    const communities = await query<any[]>(
      'SELECT id, is_private, owner_id, name FROM communities WHERE slug = ?', [slug]
    );
    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];

    const existing = await query<any[]>(
      'SELECT status FROM community_members WHERE community_id = ? AND user_id = ?',
      [community.id, session.userId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'member') {
        await query('DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
          [community.id, session.userId]);
        return NextResponse.json({ success: true, action: 'left' });
      }
      if (existing[0].status === 'banned') {
        return NextResponse.json({ error: 'You are banned from this community' }, { status: 403 });
      }
      await query('DELETE FROM community_members WHERE community_id = ? AND user_id = ?', [community.id, session.userId]); return NextResponse.json({ success: true, action: 'canceled' });
    }

    if (community.is_private) {
      await query(
        'INSERT INTO community_members (community_id, user_id, status) VALUES (?, ?, ?)',
        [community.id, session.userId, 'pending']
      );
      const actor = await query<any[]>(
        'SELECT username FROM users WHERE id = ?', [session.userId]
      );
      await query(
        `INSERT INTO notifications (user_id, actor_id, type, message, link)
         VALUES (?, ?, 'community_request', ?, ?)`,
        [
          community.owner_id, session.userId,
          actor[0].username + ' requested to join ' + community.name,
          '/community/' + slug,
        ]
      );
      return NextResponse.json({ success: true, action: 'requested' });
    }

    await query(
      'INSERT INTO community_members (community_id, user_id, status) VALUES (?, ?, ?)',
      [community.id, session.userId, 'member']
    );
    return NextResponse.json({ success: true, action: 'joined' });
  } catch (error) {
    console.error('[v0] Community join error:', error);
    return NextResponse.json({ error: 'Failed to join community' }, { status: 500 });
  }
}
