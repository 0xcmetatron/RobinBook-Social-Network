import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('userId');

    if (!memberId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const communities = await query<any[]>(
      'SELECT id, owner_id FROM communities WHERE slug = ?', [slug]
    );
    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];
    const targetId = parseInt(memberId, 10);

    if (community.owner_id !== session.userId && targetId !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await query('DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
      [community.id, targetId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
