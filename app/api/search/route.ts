import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const searchTerm = `%${q.trim()}%`;

    // Search users
    const users = await query<any[]>(
      `SELECT id, username, full_name, profile_image, bio
       FROM users
       WHERE (username LIKE ? OR full_name LIKE ? OR email LIKE ?)
       AND is_admin = 0
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm]
    );

    // Search communities
    const communities = await query<any[]>(
      `SELECT id, name, slug, description, image, is_private, (SELECT COUNT(*) FROM community_members WHERE community_id = communities.id AND status IN ('member', 'approved')) as member_count
       FROM communities
       WHERE name LIKE ? OR description LIKE ?
       LIMIT 10`,
      [searchTerm, searchTerm]
    );

    const combinedResults = [
      ...users.map(u => ({
        id: `user_${u.id}`,
        type: 'user',
        title: u.full_name || u.username,
        subtitle: `@${u.username}`,
        image: u.profile_image,
        link: `/profile/${u.id}`,
        fallback: u.username?.[0]?.toUpperCase()
      })),
      ...communities.map(c => ({
        id: `community_${c.id}`,
        type: 'community',
        title: c.name,
        subtitle: `${c.is_private ? '🔒 Private' : '🌍 Public'} · ${c.member_count} member${c.member_count !== 1 ? 's' : ''}`,
        image: c.image,
        link: `/community/${c.slug}`,
        fallback: c.name?.[0]?.toUpperCase()
      }))
    ];

    // Sort alphabetically or just return
    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error('[v0] Global search error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
