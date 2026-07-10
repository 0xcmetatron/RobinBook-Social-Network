-- Migration script to add new theme color columns and logo_size setting
-- Run this if you already have an existing database

-- Add new theme color columns if they don't exist
ALTER TABLE theme_settings 
ADD COLUMN IF NOT EXISTS muted_color VARCHAR(7) DEFAULT '#65676b' AFTER border_color,
ADD COLUMN IF NOT EXISTS success_color VARCHAR(7) DEFAULT '#42b72a' AFTER muted_color,
ADD COLUMN IF NOT EXISTS error_color VARCHAR(7) DEFAULT '#f02849' AFTER success_color,
ADD COLUMN IF NOT EXISTS warning_color VARCHAR(7) DEFAULT '#f5a623' AFTER error_color,
ADD COLUMN IF NOT EXISTS info_color VARCHAR(7) DEFAULT '#1877f2' AFTER warning_color,
ADD COLUMN IF NOT EXISTS link_color VARCHAR(7) DEFAULT '#1877f2' AFTER info_color,
ADD COLUMN IF NOT EXISTS hover_color VARCHAR(7) DEFAULT '#e4e6eb' AFTER link_color,
ADD COLUMN IF NOT EXISTS input_bg_color VARCHAR(7) DEFAULT '#f0f2f5' AFTER hover_color,
ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(7) DEFAULT '#ffffff' AFTER input_bg_color,
ADD COLUMN IF NOT EXISTS placeholder_color VARCHAR(7) DEFAULT '#999999' AFTER button_text_color;

-- Add logo_size setting if it doesn't exist
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('logo_size', '80')
ON DUPLICATE KEY UPDATE setting_value=setting_value;

-- Update existing theme_settings row with default values for new columns
UPDATE theme_settings 
SET 
  muted_color = COALESCE(muted_color, '#65676b'),
  success_color = COALESCE(success_color, '#42b72a'),
  error_color = COALESCE(error_color, '#f02849'),
  warning_color = COALESCE(warning_color, '#f5a623'),
  info_color = COALESCE(info_color, '#1877f2'),
  link_color = COALESCE(link_color, '#1877f2'),
  hover_color = COALESCE(hover_color, '#e4e6eb'),
  input_bg_color = COALESCE(input_bg_color, '#f0f2f5'),
  button_text_color = COALESCE(button_text_color, '#ffffff'),
  placeholder_color = COALESCE(placeholder_color, '#999999')
WHERE id = 1;
