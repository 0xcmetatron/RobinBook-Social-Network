import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';
import { sanitizeHtml, sanitizeRichContent } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const communities = await query<any[]>(`
      SELECT 
        c.*,
        u.username as owner_username,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id AND status IN ('member', 'approved')) as member_count
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    return NextResponse.json(communities);
  } catch (error) {
    console.error('[v0] Get communities error:', error);
    return NextResponse.json({ error: 'Failed to get communities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, description, image, is_private } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

    let imageUrl = null;
    if (image) {
      try {
        imageUrl = await uploadToImgBB(image);
      } catch {
        console.error('[v0] Community image upload error');
      }
    }

    const result = await query<any>(
      `INSERT INTO communities (name, slug, description, image, is_private, owner_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sanitizeHtml(name.trim()), slug, sanitizeRichContent(description || ''), imageUrl, is_private ? 1 : 0, session.userId, session.userId]
    );

    await query(
      `INSERT INTO community_members (community_id, user_id, status) VALUES (?, ?, 'member')`,
      [result.insertId, session.userId]
    );

    return NextResponse.json({ success: true, slug }, { status: 201 });
    } catch (error) {
    console.error('[v0] Create community error:', error);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}
