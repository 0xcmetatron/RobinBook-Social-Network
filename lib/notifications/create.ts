import { query } from '@/lib/db';

export async function createNotification(
  userId: number,
  actorId: number,
  type: string,
  message: string,
  link?: string
) {
  try {
    await query(
      'INSERT INTO notifications (user_id, actor_id, type, message, link) VALUES (?, ?, ?, ?, ?)',
      [userId, actorId, type, message, link || null]
    );
  } catch (error) {
    console.error('[notifications] create error:', error);
  }
}
