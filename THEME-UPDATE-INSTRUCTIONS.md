# Theme Colors & Logo Size Update Instructions

## What's New

This update adds:
- **9 new theme color controls** (Muted, Success, Error, Warning, Info, Link, Hover, Input Background, Button Text)
- **Logo size control** - Adjust logo size in pixels (20-300px) from admin panel
- **Copyable contract address** - Users can easily copy the contract address with one click
- **Improved form labels** - Clear labels for login/register forms instead of just placeholders

## SQL Migration Required

### For NEW Installations
If you're setting up the database for the first time, just run:
```sql
-- Run the main setup script
source scripts/setup-database.sql;
```

### For EXISTING Databases
If you already have a database running, you need to add the new columns:

**Option 1: Run the migration script**
```sql
source scripts/add-theme-colors-migration.sql;
```

**Option 2: Run these SQL commands manually**
```sql
-- Add new theme color columns
ALTER TABLE theme_settings 
ADD COLUMN IF NOT EXISTS muted_color VARCHAR(7) DEFAULT '#65676b' AFTER border_color,
ADD COLUMN IF NOT EXISTS success_color VARCHAR(7) DEFAULT '#42b72a' AFTER muted_color,
ADD COLUMN IF NOT EXISTS error_color VARCHAR(7) DEFAULT '#f02849' AFTER success_color,
ADD COLUMN IF NOT EXISTS warning_color VARCHAR(7) DEFAULT '#f5a623' AFTER error_color,
ADD COLUMN IF NOT EXISTS info_color VARCHAR(7) DEFAULT '#1877f2' AFTER warning_color,
ADD COLUMN IF NOT EXISTS link_color VARCHAR(7) DEFAULT '#1877f2' AFTER info_color,
ADD COLUMN IF NOT EXISTS hover_color VARCHAR(7) DEFAULT '#e4e6eb' AFTER link_color,
ADD COLUMN IF NOT EXISTS input_bg_color VARCHAR(7) DEFAULT '#f0f2f5' AFTER hover_color,
ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(7) DEFAULT '#ffffff' AFTER input_bg_color;

-- Add logo_size setting
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('logo_size', '80')
ON DUPLICATE KEY UPDATE setting_value=setting_value;

-- Update existing theme_settings row with default values
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
  button_text_color = COALESCE(button_text_color, '#ffffff')
WHERE id = 1;
```

## New Theme Colors Explained

1. **Muted Color** - For secondary/disabled text
2. **Success Color** - For success messages and positive actions
3. **Error Color** - For error messages and destructive actions
4. **Warning Color** - For warning messages
5. **Info Color** - For informational messages
6. **Link Color** - For hyperlinks
7. **Hover Color** - For hover states on interactive elements
8. **Input Background Color** - For form inputs and textareas
9. **Button Text Color** - For text on buttons

## Using the New Features

### Admin Panel
1. Go to `/admin` page
2. Click on "Theme Settings" tab
3. You'll see all 16 color controls (7 existing + 9 new)
4. Under "General Settings" you'll find "Logo Size (px)" - set between 20-300px
5. Click "Save All Settings" to apply changes

### Logo Size
- Default: 80px
- Recommended: 60-120px for best appearance
- Applies only to the login/register page, not the feed header

### Contract Address
- The contract address now has a copy button next to it
- Click the copy icon to copy the address to clipboard
- Shows a checkmark for 2 seconds after copying

## Troubleshooting

If you see errors after updating:
1. Make sure you ran the migration SQL commands
2. Check your database connection
3. Clear your browser cache
4. Restart your development server

If theme colors don't apply:
1. Go to Admin Panel
2. Click "Save All Settings" even without changes
3. This will ensure all colors are properly saved

## Notes

- All new columns have sensible defaults
- The migration is safe to run multiple times (uses `IF NOT EXISTS`)
- Existing theme colors won't be affected
- You can always reset colors to defaults by re-running the setup script
