import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createNotification } from '@/lib/notifications/create';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { requestId, userId, action } = await request.json();
    if (!['accepted', 'rejected', 'cancel', 'remove', 'accept'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Normalize action name
    const finalAction = action === 'accept' ? 'accepted' : action;

    let reqId = requestId;
    if (!reqId && userId) {
      // If we want to remove, the request is already accepted
      const statusFilter = (finalAction === 'remove') ? 'accepted' : 'pending';
      const reqs = await query<any[]>(
        'SELECT id FROM friend_requests WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = ?',
        [session.userId, userId, userId, session.userId, statusFilter]
      );
      if (reqs.length === 0) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      reqId = reqs[0].id;
    }

    if (!reqId) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const reqs = await query<any[]>(
      'SELECT id, sender_id, receiver_id, status FROM friend_requests WHERE id = ?',
      [reqId]
    );

    if (reqs.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const req = reqs[0];

    if (finalAction === 'cancel' || finalAction === 'remove') {
      if (finalAction === 'cancel' && req.sender_id !== session.userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      // For remove, either party can remove the friendship
      await query('DELETE FROM friend_requests WHERE id = ?', [reqId]);
      return NextResponse.json({ success: true });
    }

    if (req.receiver_id !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (req.status !== 'pending') {
      return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
    }

    await query(
      'UPDATE friend_requests SET status = ? WHERE id = ?',
      [finalAction, reqId]
    );

    if (finalAction === 'accepted') {
      await createNotification(
        req.sender_id,
        session.userId,
        'friend_accept',
        'accepted your friend request',
        '/profile/' + session.userId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Respond friend request error:', error);
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}
