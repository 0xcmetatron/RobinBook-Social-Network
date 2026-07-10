import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is owner or admin
    const users = await query<any[]>('SELECT is_admin FROM users WHERE id = ?', [session.userId]);
    const isAdmin = users[0]?.is_admin === 1 || users[0]?.is_admin === true;

    const posts = await query<any[]>('SELECT user_id, community_id FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let isCommunityOwner = false;
    if (posts[0].community_id) {
      const comms = await query<any[]>('SELECT owner_id FROM communities WHERE id = ?', [posts[0].community_id]);
      if (comms.length > 0 && comms[0].owner_id === session.userId) {
        isCommunityOwner = true;
      }
    }

    if (posts[0].user_id !== session.userId && !isAdmin && !isCommunityOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await query('DELETE FROM posts WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
