import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';
import { rateLimiter, getClientIp, sanitizeRichContent, truncateContent, containsBlockedWords, getSecuritySettings } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    
    let dbQuery = '';
    let queryParams: any[] = [];
    
    if (session) {
      dbQuery = `
        SELECT 
          p.*,
          u.username,
          u.full_name,
          u.profile_image,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.privacy = 'public'
           OR p.user_id = ?
           OR (p.privacy = 'friends' AND p.user_id IN (
               SELECT 
                 CASE 
                   WHEN sender_id = ? THEN receiver_id 
                   ELSE sender_id 
                 END
               FROM friend_requests 
               WHERE status = 'accepted' AND (sender_id = ? OR receiver_id = ?)
           ))
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
      queryParams = [session.userId, session.userId, session.userId, session.userId];
    } else {
      dbQuery = `
        SELECT 
          p.*,
          u.username,
          u.full_name,
          u.profile_image,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.privacy = 'public'
        ORDER BY p.created_at DESC
        LIMIT 50
      `;
    }

    const posts = await query<any[]>(dbQuery, queryParams);

    const enriched = await Promise.all(posts.map(async (post: any) => {
      let userLiked = false;
      let userReaction: string | null = null;
      if (session) {
        const like = await query<any[]>(
          'SELECT reaction_type FROM likes WHERE user_id = ? AND post_id = ?',
          [session.userId, post.id]
        );
        if (like.length > 0) {
          userLiked = true;
          userReaction = like[0].reaction_type || 'like';
        }
      }
      return { ...post, userLiked, userReaction };
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[v0] Get posts error:', error);
    return NextResponse.json({ error: 'Failed to get posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const security = await getSecuritySettings();
    if (security.enableRateLimiting) {
      const ip = getClientIp(request);
      const limit = rateLimiter(`post_${ip}`, security.maxPostsPerMinute, 60000);
      if (!limit.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }

    const body = await request.json();
    const { content, image } = body;
    const privacy = body.privacy || 'public';

    if (!content && !image) {
      return NextResponse.json({ error: 'Content or image is required' }, { status: 400 });
    }

    const sanitized = sanitizeRichContent(content || '');
    const maxLen = security.maxContentLength || 10000;
    const truncated = truncateContent(sanitized, maxLen);

    const isBlocked = await containsBlockedWords(truncated);
    if (isBlocked) {
      return NextResponse.json({ error: 'Content contains inappropriate language' }, { status: 400 });
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

    const result = await query<any>(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [session.userId, truncated, imageUrl]
    );

    return NextResponse.json({ success: true, postId: result.insertId }, { status: 201 });
  } catch (error) {
    console.error('[v0] Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
