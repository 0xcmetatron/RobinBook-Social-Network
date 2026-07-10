import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { reaction } = await request.json();
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    const reactionType = validReactions.includes(reaction) ? reaction : 'like';

    const existing = await query<any[]>(
      'SELECT id, reaction_type FROM likes WHERE user_id = ? AND post_id = ?',
      [session.userId, id]
    );

    if (existing.length > 0) {
      if (existing[0].reaction_type === reactionType) {
        await query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [
          session.userId, id,
        ]);
        return NextResponse.json({ success: true, liked: false });
      } else {
        await query(
          'UPDATE likes SET reaction_type = ? WHERE user_id = ? AND post_id = ?',
          [reactionType, session.userId, id]
        );
        return NextResponse.json({ success: true, liked: true, reaction: reactionType });
      }
    } else {
      await query(
        'INSERT INTO likes (user_id, post_id, reaction_type) VALUES (?, ?, ?)',
        [session.userId, id, reactionType]
      );

      const post = await query<any[]>(
        'SELECT user_id FROM posts WHERE id = ?', [id]
      );
      if (post.length > 0 && post[0].user_id !== session.userId) {
        const actor = await query<any[]>(
          'SELECT username FROM users WHERE id = ?', [session.userId]
        );
        const reactionEmojis: Record<string, string> = {
          like: '\u2764\uFE0F', love: '\uD83D\uDC9B', haha: '\uD83D\uDE06',
          wow: '\uD83D\uDE32', sad: '\uD83D\uDE22', angry: '\uD83D\uDE21',
        };
        await query(
          `INSERT INTO notifications (user_id, actor_id, type, message, link)
           VALUES (?, ?, 'reaction', ?, ?)`,
          [
            post[0].user_id, session.userId,
            `${actor[0].username} reacted ${reactionEmojis[reactionType] || '\u2764\uFE0F'} to your post`,
            `/feed`,
          ]
        );
      }

      return NextResponse.json({ success: true, liked: true, reaction: reactionType });
    }
  } catch (error) {
    console.error('[v0] Like post error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
