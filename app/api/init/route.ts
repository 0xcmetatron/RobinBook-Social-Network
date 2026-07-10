import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// This endpoint initializes the database tables and default data.
// Safe to call multiple times (idempotent).
export async function GET() {
  try {
    // Create tables
    await query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      profile_image VARCHAR(500),
      cover_image VARCHAR(500),
      bio TEXT,
      is_admin TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS site_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS theme_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      primary_color VARCHAR(7) DEFAULT '#1877f2',
      secondary_color VARCHAR(7) DEFAULT '#42b72a',
      background_color VARCHAR(7) DEFAULT '#f0f2f5',
      text_color VARCHAR(7) DEFAULT '#050505',
      accent_color VARCHAR(7) DEFAULT '#e4e6eb',
      card_color VARCHAR(7) DEFAULT '#ffffff',
      border_color VARCHAR(7) DEFAULT '#dddfe2',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content TEXT,
      image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await query(`CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await query(`CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_like (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await query(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
        link VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await query(`CREATE TABLE IF NOT EXISTS communities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      image VARCHAR(500),
      image_url VARCHAR(500),
      banner_url VARCHAR(500),
      is_private TINYINT(1) DEFAULT 0,
      owner_id INT,
      post_permission ENUM('all','admin') DEFAULT 'all',
      member_count INT DEFAULT 0,
      creator_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    await query(`CREATE TABLE IF NOT EXISTS community_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      community_id INT NOT NULL,
      user_id INT NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      status ENUM('member','pending','banned') DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_member (community_id, user_id),
      FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Add cover_image column if it doesn't exist (migration for existing databases)
    try {
      await query(`ALTER TABLE users ADD COLUMN cover_image VARCHAR(500) AFTER profile_image`);
    } catch {
      // Column already exists, ignore
    }

    // Add community_id column to posts if not exists
    try {
      await query(`ALTER TABLE posts ADD COLUMN community_id INT AFTER image_url`);
    } catch {
      // Column already exists, ignore
    }

    // Add columns to communities if not exists (migration for existing databases)
    try { await query(`ALTER TABLE communities ADD COLUMN description TEXT`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN image VARCHAR(500)`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN image_url VARCHAR(500)`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN banner_url VARCHAR(500)`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN is_private TINYINT(1) DEFAULT 0`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN owner_id INT`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN post_permission ENUM('all','admin') DEFAULT 'all'`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN member_count INT DEFAULT 0`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN creator_id INT NOT NULL`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`); } catch {}
    try { await query(`ALTER TABLE communities ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch {}

    // Add columns to community_members if not exists (migration for existing databases)
    try { await query(`ALTER TABLE community_members ADD COLUMN role VARCHAR(50) DEFAULT 'member'`); } catch {}
    try { await query(`ALTER TABLE community_members ADD COLUMN status ENUM('member','pending','banned') DEFAULT 'member'`); } catch {}
    try { await query(`ALTER TABLE community_members ADD COLUMN joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`); } catch {}

    // Add missing community owners as members
    try {
      await query(`
        INSERT INTO community_members (community_id, user_id, role, status, joined_at)
        SELECT c.id, c.owner_id, 'admin', 'member', c.created_at
        FROM communities c
        LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = c.owner_id
        WHERE c.owner_id IS NOT NULL AND cm.id IS NULL
      `);
    } catch (e) {
      console.error('[init] Add owner members migration error:', e);
    }

    // Add reaction_type column to likes if not exists
    try {
      await query(`ALTER TABLE likes ADD COLUMN reaction_type VARCHAR(20) DEFAULT 'like' AFTER user_id`);
    } catch {
      // Column already exists, ignore
    }

    // Create notifications table
    await query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      actor_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(500),
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Create friend_requests table
    await query(`CREATE TABLE IF NOT EXISTS friend_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      status ENUM('pending','accepted','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_request (sender_id, receiver_id),
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Create messages table for private DMs
    await query(`CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      content TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Create admin user if not exists
    const existingAdmin = await query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      ['admin@admin.com']
    );

    if (existingAdmin.length === 0) {
      const hashedPassword = await hashPassword('Alex159@');
      await query(
        'INSERT INTO users (email, username, password, full_name, is_admin) VALUES (?, ?, ?, ?, 1)',
        ['admin@admin.com', 'admin', hashedPassword, 'Administrator']
      );
    }

    // Insert default site settings (only if they don't exist)
    const defaultSettings: Record<string, string> = {
      site_name: 'SolConnect',
      site_title: 'SolConnect - Buy. Hold. Earn SOL.',
      site_slogan: 'Connect with holders and earn SOL rewards every 10 seconds',
      site_description: 'Join our community of token holders. Share, connect, and earn SOL rewards automatically every 10 seconds just by holding our token.',
      logo_url: '',
      contract_address: 'YOUR_TOKEN_MINT_ADDRESS_HERE',
      twitter_url: 'https://twitter.com/yourproject',
      favicon_url: '',
      copyright_text: '2024 SolConnect. All rights reserved.',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await query(
        `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_key = setting_key`,
        [key, value]
      );
    }

    // Insert default theme settings if not exists
    const existingTheme = await query<any[]>('SELECT id FROM theme_settings WHERE id = 1');
    if (existingTheme.length === 0) {
      await query(
        `INSERT INTO theme_settings (id, primary_color, secondary_color, background_color, text_color, accent_color, card_color, border_color)
         VALUES (1, '#1877f2', '#42b72a', '#f0f2f5', '#050505', '#e4e6eb', '#ffffff', '#dddfe2')`
      );
    }

    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('[v0] Database init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}
