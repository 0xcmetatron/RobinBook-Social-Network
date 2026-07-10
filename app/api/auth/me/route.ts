import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const users = await query<any[]>(
      'SELECT id, username, email, full_name, bio, profile_image, cover_image, is_admin, created_at FROM users WHERE id = ?',
      [session.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      bio: user.bio,
      profile_image: user.profile_image,
      cover_image: user.cover_image,
      isAdmin: user.is_admin === 1 || user.is_admin === true,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('[v0] Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
