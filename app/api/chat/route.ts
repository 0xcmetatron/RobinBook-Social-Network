import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimiter, getClientIp, sanitizeRichContent, truncateContent, containsBlockedWords, getSecuritySettings } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since') || '0';

    // We want the most recent messages, ordered chronologically.
    // So we fetch the latest 100 messages (ordered DESC) and then reverse them to ASC.
    const messages = await query<any[]>(
      `SELECT * FROM (
        SELECT 
          m.*,
          u.username,
          u.full_name,
          u.profile_image
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id > ?
        ORDER BY m.id DESC
        LIMIT 100
      ) sub
      ORDER BY created_at ASC`,
      [since]
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('[v0] Get chat messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const settings = await getSecuritySettings();

    const rlKey = `chat:${session.userId}`;
    const maxMessages = settings?.maxMessagesPerMinute || 10;
    const rlCheck = rateLimiter(rlKey, maxMessages, 60000);
    if (!rlCheck.allowed) {
      return NextResponse.json(
        { error: `Too many messages. Try again in ${Math.ceil(rlCheck.remaining / 1000)}s.` },
        { status: 429 }
      );
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const sanitized = sanitizeRichContent(message);
    const maxLen = settings?.maxContentLength || 10000;
    const truncated = truncateContent(sanitized, maxLen);

    const isBlocked = await containsBlockedWords(truncated);
    if (isBlocked) {
      return NextResponse.json({ error: 'Message contains inappropriate language' }, { status: 400 });
    }

    const result = await query<any>(
      'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)',
      [session.userId, truncated]
    );

    return NextResponse.json(
      { success: true, messageId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Create chat message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
