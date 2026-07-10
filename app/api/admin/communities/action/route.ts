import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { action, communityId } = await request.json();
    if (!communityId) return NextResponse.json({ error: 'Community ID is required' }, { status: 400 });

    if (action === 'delete') {
      await query(`DELETE FROM communities WHERE id = ?`, [communityId]);
      await query(`DELETE FROM community_members WHERE community_id = ?`, [communityId]);
      await query(`DELETE FROM posts WHERE community_id = ?`, [communityId]);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
