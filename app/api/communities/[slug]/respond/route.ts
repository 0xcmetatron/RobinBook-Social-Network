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
    const { userId, action } = await request.json();

    const communities = await query<any[]>(
      'SELECT id, owner_id FROM communities WHERE slug = ?', [slug]
    );
    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];
    if (community.owner_id !== session.userId) {
      return NextResponse.json({ error: 'Only the owner can approve/reject members' }, { status: 403 });
    }

    if (action === 'approve') {
      await query(
        'UPDATE community_members SET status = ? WHERE community_id = ? AND user_id = ? AND status = ?',
        ['member', community.id, userId, 'pending']
      );
    } else if (action === 'reject') {
      await query(
        'DELETE FROM community_members WHERE community_id = ? AND user_id = ? AND status = ?',
        [community.id, userId, 'pending']
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Community respond error:', error);
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}
