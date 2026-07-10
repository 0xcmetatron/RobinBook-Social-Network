import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sanitizeRichContent, truncateContent } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const messages = await query<any[]>(`
        SELECT m.*, u.username, u.full_name, u.profile_image
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
        LIMIT 100
      `, [session.userId, userId, userId, session.userId]);

      await query(
        'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
        [userId, session.userId]
      );

      return NextResponse.json(messages);
    }

    const conversations = await query<any[]>(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.username, u.full_name, u.profile_image,
        m.content as last_message,
        m.created_at as last_message_at,
        m.sender_id as last_sender_id,
        (SELECT COUNT(*) FROM messages WHERE sender_id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AND receiver_id = ? AND is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
      WHERE m.id IN (
        SELECT MAX(id) FROM messages 
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      )
      ORDER BY m.created_at DESC
    `, [session.userId, session.userId, session.userId, session.userId, session.userId, session.userId, session.userId]);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('[v0] Get messages error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { receiverId, content } = await request.json();
    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Receiver and content are required' }, { status: 400 });
    }

    const areFriends = await query<any[]>(
      `SELECT id FROM friend_requests 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
       AND status = 'accepted'`,
      [session.userId, receiverId, receiverId, session.userId]
    );

    if (areFriends.length === 0) {
      return NextResponse.json({ error: 'You must be friends to send a message' }, { status: 403 });
    }

    const sanitized = sanitizeRichContent(content);
    const truncated = truncateContent(sanitized);

    await query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [session.userId, receiverId, truncated]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[v0] Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
