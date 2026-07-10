import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiter, getClientIp, sanitizeRichContent, truncateContent, containsBlockedWords, getSecuritySettings } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await query<any[]>(
      `SELECT 
        c.*,
        u.username,
        u.full_name,
        u.profile_image
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC`,
      [id]
    );

    return NextResponse.json(comments);
  } catch (error) {
    console.error('[v0] Get comments error:', error);
    return NextResponse.json(
      { error: 'Failed to get comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const settings = await getSecuritySettings();

    const rlKey = `comment:${session.userId}`;
    const maxComments = settings?.maxCommentsPerMinute || 10;
    const rlCheck = rateLimiter(rlKey, maxComments, 60000);
    if (!rlCheck.allowed) {
      return NextResponse.json(
        { error: `Too many comments. Try again in ${Math.ceil(rlCheck.remaining / 1000)}s.` },
        { status: 429 }
      );
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const sanitized = sanitizeRichContent(content);
    const maxLen = settings?.maxContentLength || 10000;
    const truncated = truncateContent(sanitized, maxLen);

    const isBlocked = await containsBlockedWords(truncated);
    if (isBlocked) {
      return NextResponse.json({ error: 'Comment contains inappropriate language' }, { status: 400 });
    }

    const result = await query<any>(
      'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
      [session.userId, id, truncated]
    );

    const post = await query<any[]>(
      'SELECT user_id FROM posts WHERE id = ?', [id]
    );
    if (post.length > 0 && post[0].user_id !== session.userId) {
      const actor = await query<any[]>(
        'SELECT username FROM users WHERE id = ?', [session.userId]
      );
      const shortContent = truncated.length > 80 ? truncated.substring(0, 80) + '...' : truncated;
      await query(
        `INSERT INTO notifications (user_id, actor_id, type, message, link)
         VALUES (?, ?, 'comment', ?, ?)`,
        [
          post[0].user_id, session.userId,
          `${actor[0].username} commented on your post: "${shortContent}"`,
          `/feed`,
        ]
      );
    }

    return NextResponse.json(
      { success: true, commentId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Create comment error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
