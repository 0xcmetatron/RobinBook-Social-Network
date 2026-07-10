import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reactions = await query<any[]>(
      `SELECT 
        l.reaction_type,
        u.id as user_id,
        u.username,
        u.full_name,
        u.profile_image
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.post_id = ?
      ORDER BY l.created_at DESC`,
      [id]
    );

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('[v0] Get reactions error:', error);
    return NextResponse.json(
      { error: 'Failed to get reactions' },
      { status: 500 }
    );
  }
}
