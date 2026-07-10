import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications/create';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { receiverId } = await request.json();
    if (!receiverId) return NextResponse.json({ error: 'Receiver is required' }, { status: 400 });

    if (receiverId === session.userId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    const existing = await query<any[]>(
      'SELECT id, status FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
      [session.userId, receiverId, receiverId, session.userId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }
      if (existing[0].status === 'pending') {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
      }
    }

    await query(
      'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
      [session.userId, receiverId, 'pending']
    );

    await createNotification(
      receiverId,
      session.userId,
      'friend_request',
      'sent you a friend request',
      `/profile/${session.userId}`
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[v0] Send friend request error:', error);
    return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const received = await query<any[]>(`
      SELECT fr.id, fr.sender_id, fr.status, fr.created_at,
        u.username, u.full_name, u.profile_image
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [session.userId]);

    const sent = await query<any[]>(`
      SELECT fr.id, fr.receiver_id, fr.status, fr.created_at,
        u.username, u.full_name, u.profile_image
      FROM friend_requests fr
      JOIN users u ON fr.receiver_id = u.id
      WHERE fr.sender_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [session.userId]);

    return NextResponse.json({ received, sent });
  } catch (error) {
    console.error('[v0] Get friend requests error:', error);
    return NextResponse.json({ error: 'Failed to get requests' }, { status: 500 });
  }
}
