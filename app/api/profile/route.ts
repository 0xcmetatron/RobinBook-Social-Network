import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';
import { sanitizeHtml, sanitizeRichContent } from '@/lib/security';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { full_name, bio, profile_image, cover_image } = await request.json();

    let imageUrl = null;
    let coverUrl = null;

    // Upload profile image to ImgBB if provided
    if (profile_image) {
      try {
        imageUrl = await uploadToImgBB(profile_image);
      } catch (error) {
        console.error('[v0] Image upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    // Upload cover image to ImgBB if provided
    if (cover_image) {
      try {
        coverUrl = await uploadToImgBB(cover_image);
      } catch (error) {
        console.error('[v0] Cover image upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload cover image' },
          { status: 500 }
        );
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(sanitizeHtml(String(full_name)));
    }

    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(sanitizeRichContent(String(bio)));
    }

    if (imageUrl) {
      updates.push('profile_image = ?');
      values.push(imageUrl);
    }

    if (coverUrl) {
      updates.push('cover_image = ?');
      values.push(coverUrl);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(session.userId);

    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
