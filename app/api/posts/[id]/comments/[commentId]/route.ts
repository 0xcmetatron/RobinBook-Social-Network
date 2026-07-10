import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, commentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { commentId } = await params;

    // Check if user is owner or admin
    const users = await query<any[]>('SELECT is_admin FROM users WHERE id = ?', [session.userId]);
    const isAdmin = users[0]?.is_admin === 1 || users[0]?.is_admin === true;

    const comments = await query<any[]>('SELECT user_id, post_id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    let isCommunityOwner = false;
    const posts = await query<any[]>('SELECT community_id FROM posts WHERE id = ?', [comments[0].post_id]);
    if (posts.length > 0 && posts[0].community_id) {
      const comms = await query<any[]>('SELECT owner_id FROM communities WHERE id = ?', [posts[0].community_id]);
      if (comms.length > 0 && comms[0].owner_id === session.userId) {
        isCommunityOwner = true;
      }
    }

    if (comments[0].user_id !== session.userId && !isAdmin && !isCommunityOwner) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await query('DELETE FROM comments WHERE id = ?', [commentId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
