import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import {
  getSecuritySettings,
  saveSecuritySettings,
  defaultSecuritySettings,
  SecuritySettings,
} from '@/lib/security';

export async function GET() {
  const DEFAULT_THEME = {
    primary_color: '#1877f2',
    secondary_color: '#42b72a',
    background_color: '#f0f2f5',
    text_color: '#050505',
    accent_color: '#e4e6eb',
    card_color: '#ffffff',
    border_color: '#dddfe2',
    muted_color: '#65676b',
    success_color: '#42b72a',
    error_color: '#f02849',
    warning_color: '#f5a623',
    info_color: '#1877f2',
    link_color: '#1877f2',
    hover_color: '#e4e6eb',
    input_bg_color: '#f0f2f5',
    button_text_color: '#ffffff',
    placeholder_color: '#999999',
  };

  try {
    const session = await getSession();
    const isAdmin = session?.isAdmin === true;
    // Fetch all key-value pairs from site_settings
    let settingsRows: any[] = [];
    let themeRows: any[] = [];

    try {
      settingsRows = await query<any[]>('SELECT setting_key, setting_value FROM site_settings');
    } catch (e) {
      console.error('[v0] Failed to fetch site_settings:', e);
    }

    try {
      themeRows = await query<any[]>('SELECT * FROM theme_settings WHERE id = 1');
    } catch (e) {
      console.error('[v0] Failed to fetch theme_settings:', e);
    }

    // Convert key-value rows into a flat object
    const settings: Record<string, string> = {};
    if (Array.isArray(settingsRows)) {
      for (const row of settingsRows) {
        settings[row.setting_key] = row.setting_value;
      }
    }

    const themeData = themeRows.length > 0 ? {
      primary_color: themeRows[0].primary_color || DEFAULT_THEME.primary_color,
      secondary_color: themeRows[0].secondary_color || DEFAULT_THEME.secondary_color,
      background_color: themeRows[0].background_color || DEFAULT_THEME.background_color,
      text_color: themeRows[0].text_color || DEFAULT_THEME.text_color,
      accent_color: themeRows[0].accent_color || DEFAULT_THEME.accent_color,
      card_color: themeRows[0].card_color || DEFAULT_THEME.card_color,
      border_color: themeRows[0].border_color || DEFAULT_THEME.border_color,
      muted_color: themeRows[0].muted_color || DEFAULT_THEME.muted_color,
      success_color: themeRows[0].success_color || DEFAULT_THEME.success_color,
      error_color: themeRows[0].error_color || DEFAULT_THEME.error_color,
      warning_color: themeRows[0].warning_color || DEFAULT_THEME.warning_color,
      info_color: themeRows[0].info_color || DEFAULT_THEME.info_color,
      link_color: themeRows[0].link_color || DEFAULT_THEME.link_color,
      hover_color: themeRows[0].hover_color || DEFAULT_THEME.hover_color,
      input_bg_color: themeRows[0].input_bg_color || DEFAULT_THEME.input_bg_color,
      button_text_color: themeRows[0].button_text_color || DEFAULT_THEME.button_text_color,
      placeholder_color: themeRows[0].placeholder_color || DEFAULT_THEME.placeholder_color,
    } : DEFAULT_THEME;

    const securitySettings = isAdmin ? await getSecuritySettings() : undefined;

    const result: Record<string, any> = {
      site_name: (settings.site_name || 'RobinBook').replace(/RobinBook/ig, 'RobinBook').replace(/Black Social Network/ig, 'RobinBook Social Network'),
      site_title: (settings.site_title || 'RobinBook - Buy. Hold. Earn SOL.').replace(/RobinBook/ig, 'RobinBook').replace(/Black Social Network/ig, 'RobinBook Social Network'),
      site_description: (settings.site_description || 'Join our community of token holders.').replace(/RobinBook/ig, 'RobinBook').replace(/Black Social Network/ig, 'RobinBook Social Network'),
      site_slogan: settings.site_slogan || 'Connect with holders and earn SOL rewards',
      logo_url: settings.logo_url || '',
      logo_size: settings.logo_size || '80',
      favicon_url: settings.favicon_url || '',
      contract_address: settings.contract_address || '',
      twitter_url: settings.twitter_url || '',
      copyright_text: (settings.copyright_text || '').replace(/RobinBook/ig, 'RobinBook').replace(/Black Social Network/ig, 'RobinBook Social Network'),
      dev_wallet: settings.dev_wallet || '',
      theme_json: settings.theme_json || '',
    };

    if (isAdmin) {
      result.theme = themeData;
      result.security = securitySettings;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[v0] Get settings error:', error);
    // Return sensible defaults so the app still works
    return NextResponse.json({
      site_name: 'RobinBook',
      site_title: 'RobinBook - Buy. Hold. Earn SOL.',
      site_description: 'Join our community of token holders.',
      site_slogan: 'Connect with holders and earn SOL rewards',
      logo_url: '',
      logo_size: '80',
      favicon_url: '',
      contract_address: '',
      twitter_url: '',
      copyright_text: '',
      dev_wallet: '',
      theme_json: '',
      theme: DEFAULT_THEME,
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      site_name,
      site_title,
      site_description,
      site_slogan,
      logo_url,
      logo_size,
      favicon_url,
      contract_address,
      twitter_url,
      copyright_text,
      theme,
      dev_wallet,
      theme_json,
    } = data;

    // Update site settings as key-value pairs using upsert
    const settingsToUpdate: Record<string, string> = {
      site_name: site_name || '',
      site_title: site_title || '',
      site_description: site_description || '',
      site_slogan: site_slogan || '',
      logo_url: logo_url || '',
      logo_size: logo_size || '80',
      favicon_url: favicon_url || '',
      contract_address: contract_address || '',
      twitter_url: twitter_url || '',
      copyright_text: copyright_text || '',
      dev_wallet: dev_wallet || '',
      theme_json: theme_json || '',
    };

    const { security } = data;

    if (security) {
      const sanitized: SecuritySettings = {
        ...defaultSecuritySettings,
        maxPostsPerMinute: Math.max(1, Math.min(100, Number(security.maxPostsPerMinute) || defaultSecuritySettings.maxPostsPerMinute)),
        maxCommentsPerMinute: Math.max(1, Math.min(100, Number(security.maxCommentsPerMinute) || defaultSecuritySettings.maxCommentsPerMinute)),
        maxMessagesPerMinute: Math.max(1, Math.min(100, Number(security.maxMessagesPerMinute) || defaultSecuritySettings.maxMessagesPerMinute)),
        maxContentLength: Math.max(100, Math.min(50000, Number(security.maxContentLength) || defaultSecuritySettings.maxContentLength)),
        strictSanitization: security.strictSanitization !== false,
        sessionTimeoutMinutes: Math.max(60, Math.min(43200, Number(security.sessionTimeoutMinutes) || defaultSecuritySettings.sessionTimeoutMinutes)),
        maxLoginAttempts: Math.max(1, Math.min(20, Number(security.maxLoginAttempts) || defaultSecuritySettings.maxLoginAttempts)),
        blockedWords: String(security.blockedWords || ''),
        enableRateLimiting: security.enableRateLimiting !== false,
      };
      await saveSecuritySettings(sanitized);
    }

    for (const [key, value] of Object.entries(settingsToUpdate)) {
      await query(
        `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, value]
      );
    }

    // Update theme settings if provided
    if (theme) {
      await query(
        `UPDATE theme_settings SET 
          primary_color = ?,
          secondary_color = ?,
          accent_color = ?,
          background_color = ?,
          text_color = ?,
          card_color = ?,
          border_color = ?,
          muted_color = ?,
          success_color = ?,
          error_color = ?,
          warning_color = ?,
          info_color = ?,
          link_color = ?,
          hover_color = ?,
          input_bg_color = ?,
          button_text_color = ?,
          placeholder_color = ?,
          updated_at = NOW()
        WHERE id = 1`,
        [
          theme.primary_color,
          theme.secondary_color,
          theme.accent_color,
          theme.background_color,
          theme.text_color,
          theme.card_color,
          theme.border_color,
          theme.muted_color || '#65676b',
          theme.success_color || '#42b72a',
          theme.error_color || '#f02849',
          theme.warning_color || '#f5a623',
          theme.info_color || '#1877f2',
          theme.link_color || '#1877f2',
          theme.hover_color || '#e4e6eb',
          theme.input_bg_color || '#f0f2f5',
          theme.button_text_color || '#ffffff',
          theme.placeholder_color || '#999999',
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
