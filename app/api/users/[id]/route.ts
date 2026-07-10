import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Fetch user info
    const users = await query<any[]>(
      `SELECT id, username, full_name, profile_image, cover_image, bio, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Fetch user's posts
    const posts = await query<any[]>(
      `SELECT 
        p.*,
        u.username,
        u.full_name,
        u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50`,
      [userId]
    );

    // Get post count
    const postCount = await query<any[]>(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
      [userId]
    );

    return NextResponse.json({
      user,
      posts,
      postCount: postCount[0]?.count || 0,
    });
  } catch (error) {
    console.error('[v0] Get user profile error:', error);
    return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 });
  }
}
