-- =====================================================
-- COMPLETE DATABASE SETUP SCRIPT - SolConnect
-- =====================================================
-- This script contains ALL tables with ALL columns
-- Run this for a fresh database installation
-- =====================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id),
  INDEX idx_created_at (created_at)
);

-- Create site_settings table (key-value pairs)
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
);

-- Create theme_settings table with ALL color options
CREATE TABLE IF NOT EXISTS theme_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  primary_color VARCHAR(7) DEFAULT '#1877f2',
  secondary_color VARCHAR(7) DEFAULT '#42b72a',
  background_color VARCHAR(7) DEFAULT '#f0f2f5',
  text_color VARCHAR(7) DEFAULT '#050505',
  accent_color VARCHAR(7) DEFAULT '#e4e6eb',
  card_color VARCHAR(7) DEFAULT '#ffffff',
  border_color VARCHAR(7) DEFAULT '#dddfe2',
  muted_color VARCHAR(7) DEFAULT '#65676b',
  success_color VARCHAR(7) DEFAULT '#42b72a',
  error_color VARCHAR(7) DEFAULT '#f02849',
  warning_color VARCHAR(7) DEFAULT '#f5a623',
  info_color VARCHAR(7) DEFAULT '#1877f2',
  link_color VARCHAR(7) DEFAULT '#1877f2',
  hover_color VARCHAR(7) DEFAULT '#e4e6eb',
  input_bg_color VARCHAR(7) DEFAULT '#f0f2f5',
  button_text_color VARCHAR(7) DEFAULT '#ffffff',
  placeholder_color VARCHAR(7) DEFAULT '#999999',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default site settings with logo_size
INSERT INTO site_settings (setting_key, setting_value) VALUES 
('site_name', 'SolConnect'),
('site_title', 'SolConnect - Buy. Hold. Earn SOL.'),
('site_slogan', 'Connect with holders and earn SOL rewards every 10 seconds'),
('site_description', 'Join our community of token holders. Share, connect, and earn SOL rewards automatically every 10 seconds just by holding our token.'),
('logo_url', ''),
('logo_size', '80'),
('contract_address', 'YOUR_TOKEN_MINT_ADDRESS_HERE'),
('twitter_url', 'https://twitter.com/yourproject'),
('favicon_url', ''),
('copyright_text', '2024 SolConnect. All rights reserved.')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Insert default theme settings with ALL colors
INSERT INTO theme_settings (
  id, 
  primary_color, 
  secondary_color, 
  background_color, 
  text_color, 
  accent_color, 
  card_color, 
  border_color, 
  muted_color, 
  success_color, 
  error_color, 
  warning_color, 
  info_color, 
  link_color, 
  hover_color, 
  input_bg_color, 
  button_text_color,
  placeholder_color
) 
VALUES (
  1, 
  '#1877f2', 
  '#42b72a', 
  '#f0f2f5', 
  '#050505', 
  '#e4e6eb', 
  '#ffffff', 
  '#dddfe2', 
  '#65676b', 
  '#42b72a', 
  '#f02849', 
  '#f5a623', 
  '#1877f2', 
  '#1877f2', 
  '#e4e6eb', 
  '#f0f2f5', 
  '#ffffff',
  '#999999'
)
ON DUPLICATE KEY UPDATE 
  primary_color=VALUES(primary_color),
  secondary_color=VALUES(secondary_color),
  background_color=VALUES(background_color),
  text_color=VALUES(text_color),
  accent_color=VALUES(accent_color),
  card_color=VALUES(card_color),
  border_color=VALUES(border_color),
  muted_color=VALUES(muted_color),
  success_color=VALUES(success_color),
  error_color=VALUES(error_color),
  warning_color=VALUES(warning_color),
  info_color=VALUES(info_color),
  link_color=VALUES(link_color),
  hover_color=VALUES(hover_color),
  input_bg_color=VALUES(input_bg_color),
  button_text_color=VALUES(button_text_color),
  placeholder_color=VALUES(placeholder_color);

-- Create default admin user (username: admin, password: Alex159@)
-- Password hash for 'Alex159@' using bcrypt
INSERT INTO users (username, email, password, full_name, is_admin) 
VALUES (
  'admin', 
  'admin@admin.com', 
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
  'Administrator',
  TRUE
)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Default Admin Login:
--   Username: admin
--   Password: Alex159@
-- 
-- All theme colors are now customizable in Admin Panel
-- Logo size is adjustable (default: 80px)
-- Placeholder text color is customizable
-- =====================================================
