import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

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

    // Search by username, full_name, or email - exclude admin accounts (is_admin = 1)
    const users = await query<any[]>(
      `SELECT id, username, full_name, profile_image, bio
       FROM users
       WHERE (username LIKE ? OR full_name LIKE ? OR email LIKE ?)
       AND is_admin = 0
       LIMIT 20`,
      [searchTerm, searchTerm, searchTerm]
    );

    return NextResponse.json(users || []);
  } catch (error) {
    console.error('[v0] Search users error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
