import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';
import { sanitizeRichContent, truncateContent, containsBlockedWords } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { slug } = await params;
    const communities = await query<any[]>('SELECT id FROM communities WHERE slug = ?', [slug]);
    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const communityId = communities[0].id;

    const rows = await query<any[]>(`
      SELECT 
        p.*,
        u.username,
        u.full_name,
        u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.community_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [communityId]);

    const posts = await Promise.all(rows.map(async (post: any) => {
      let userLiked = false;
      let userReaction: string | null = null;
      const like = await query<any[]>(
        'SELECT reaction_type FROM likes WHERE user_id = ? AND post_id = ?',
        [session.userId, post.id]
      );
      if (like.length > 0) {
        userLiked = true;
        userReaction = like[0].reaction_type || 'like';
      }
      return { ...post, userLiked, userReaction };
    }));

    return NextResponse.json(posts);
  } catch (error) {
    console.error('[v0] Get community posts error:', error);
    return NextResponse.json({ error: 'Failed to get posts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { slug } = await params;
    const communities = await query<any[]>(
      'SELECT c.id, c.owner_id, c.post_permission FROM communities c WHERE c.slug = ?', [slug]
    );
    if (communities.length === 0) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    const community = communities[0];

    if (community.owner_id !== session.userId) {
      if (community.post_permission === 'admin') {
        return NextResponse.json({ error: 'Only admins can post in this community' }, { status: 403 });
      }

      const memberCheck = await query<any[]>(
        'SELECT status FROM community_members WHERE community_id = ? AND user_id = ?',
        [community.id, session.userId]
      );
      if (memberCheck.length === 0 || memberCheck[0].status !== 'member') {
        return NextResponse.json({ error: 'You must be a member to post' }, { status: 403 });
      }
    }

    const { content, image } = await request.json();
    if (!content && !image) {
      return NextResponse.json({ error: 'Content or image is required' }, { status: 400 });
    }

    let imageUrl = null;
    if (image) {
      try {
        imageUrl = await uploadToImgBB(image);
      } catch (error) {
        console.error('[v0] Image upload error:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }
    }

    const sanitized = sanitizeRichContent(content || '');
    const truncated = truncateContent(sanitized);

    const isBlocked = await containsBlockedWords(truncated);
    if (isBlocked) {
      return NextResponse.json({ error: 'Content contains inappropriate language' }, { status: 400 });
    }

    const result = await query<any>(
      'INSERT INTO posts (user_id, content, image_url, community_id) VALUES (?, ?, ?, ?)',
      [session.userId, truncated, imageUrl, community.id]
    );

    return NextResponse.json({ success: true, postId: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('[v0] Create community post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
