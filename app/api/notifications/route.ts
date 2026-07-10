import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const notifications = await query<any[]>(
      `SELECT n.*, u.username as actor_username, u.profile_image as actor_image
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 30`,
      [session.userId]
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[v0] Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const placeholders = notificationIds.map(() => '?').join(',');
    await query(
      `UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders}) AND user_id = ?`,
      [...notificationIds, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Mark specific notifications read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
