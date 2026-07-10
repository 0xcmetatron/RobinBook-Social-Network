import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sanitizeHtml, sanitizeRichContent } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug } = await params;

    const communities = await query<any[]>(`
      SELECT 
        c.*,
        u.username as owner_username,
        u.full_name as owner_full_name,
        u.profile_image as owner_profile_image,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id AND status IN ('member', 'approved')) as member_count
      FROM communities c
      JOIN users u ON c.owner_id = u.id
      WHERE c.slug = ?
    `, [slug]);

    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];

    let memberStatus = null;
    const memberRows = await query<any[]>(
      'SELECT status FROM community_members WHERE community_id = ? AND user_id = ?',
      [community.id, session.userId]
    );
    if (memberRows.length > 0) {
      memberStatus = memberRows[0].status;
    } else if (community.owner_id === session.userId) {
      memberStatus = 'member';
    }

    const members = await query<any[]>(`
      SELECT u.id, u.username, u.full_name, u.profile_image, cm.status, cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = ? AND cm.status IN ('member', 'pending')
      ORDER BY cm.joined_at ASC
    `, [community.id]);

    if (!members.find((m: any) => m.id === community.owner_id)) {
      members.unshift({
        id: community.owner_id,
        username: community.owner_username,
        full_name: community.owner_full_name,
        profile_image: community.owner_profile_image,
        status: 'member',
        joined_at: community.created_at,
      });
    }

    return NextResponse.json({ community, memberStatus, members });
  } catch (error) {
    console.error('[v0] Get community error:', error);
    return NextResponse.json({ error: 'Failed to get community' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { slug } = await params;
    const communities = await query<any[]>(
      'SELECT id, owner_id, post_permission FROM communities WHERE slug = ?', [slug]
    );
    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];
    if (community.owner_id !== session.userId) {
      return NextResponse.json({ error: 'Only the owner can edit this community' }, { status: 403 });
    }

    const { name, description, image, banner, is_private, post_permission } = await request.json();
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(sanitizeHtml(String(name))); }
    if (description !== undefined) { updates.push('description = ?'); values.push(sanitizeRichContent(String(description))); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (banner !== undefined) { updates.push('banner_url = ?'); values.push(banner ? `data:image/png;base64,${banner}` : null); }
    if (is_private !== undefined) { updates.push('is_private = ?'); values.push(is_private ? 1 : 0); }
    if (post_permission !== undefined) { updates.push('post_permission = ?'); values.push(post_permission); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(community.id);
    await query(`UPDATE communities SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Update community error:', error);
    return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
  }
}

