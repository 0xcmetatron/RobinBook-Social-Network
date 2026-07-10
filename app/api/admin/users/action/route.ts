import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { action, userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    if (action === 'promote') {
      // Create is_admin column if it does not exist (migration), then toggle
      try {
        await query(`ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0`);
      } catch {}
      await query(`UPDATE users SET is_admin = NOT is_admin WHERE id = ?`, [userId]);
    } else if (action === 'delete') {
      // Delete user entirely
      await query(`DELETE FROM users WHERE id = ?`, [userId]);
      await query(`DELETE FROM posts WHERE user_id = ?`, [userId]);
      await query(`DELETE FROM comments WHERE user_id = ?`, [userId]);
      await query(`DELETE FROM likes WHERE user_id = ?`, [userId]);
      await query(`DELETE FROM community_members WHERE user_id = ?`, [userId]);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
