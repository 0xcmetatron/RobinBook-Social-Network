const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeRichContent(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
}

export function sanitizeUsername(input: string): string {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9_@.\-\s]/g, '').trim();
}

export function rateLimiter(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAfter: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAfter: windowMs };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAfter: record.resetAt - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAfter: record.resetAt - now,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password too long' };
  }
  return { valid: true, message: '' };
}

export function truncateContent(content: string, maxLength: number = 5000): string {
  if (!content) return '';
  return content.length > maxLength ? content.substring(0, maxLength) : content;
}

const SECURITY_SETTINGS_KEY = 'security_settings';

export interface SecuritySettings {
  maxPostsPerMinute: number;
  maxCommentsPerMinute: number;
  maxMessagesPerMinute: number;
  maxContentLength: number;
  strictSanitization: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  blockedWords: string;
  enableRateLimiting: boolean;
}

export const defaultSecuritySettings: SecuritySettings = {
  maxPostsPerMinute: 5,
  maxCommentsPerMinute: 10,
  maxMessagesPerMinute: 20,
  maxContentLength: 5000,
  strictSanitization: true,
  sessionTimeoutMinutes: 10080,
  maxLoginAttempts: 5,
  blockedWords: '',
  enableRateLimiting: true,
};

export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    const { query } = await import('./db');
    const rows = await query<any[]>(
      "SELECT setting_value FROM site_settings WHERE setting_key = ?",
      [SECURITY_SETTINGS_KEY]
    );
    if (rows.length > 0 && rows[0].setting_value) {
      return { ...defaultSecuritySettings, ...JSON.parse(rows[0].setting_value) };
    }
  } catch {}
  return defaultSecuritySettings;
}

export async function saveSecuritySettings(
  settings: SecuritySettings
): Promise<void> {
  const { query } = await import('./db');
  await query(
    `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = ?`,
    [SECURITY_SETTINGS_KEY, JSON.stringify(settings), JSON.stringify(settings)]
  );
}

export async function containsBlockedWords(
  content: string,
  blockedWordsList?: string
): Promise<boolean> {
  let wordsString = blockedWordsList;
  if (wordsString === undefined) {
    const settings = await getSecuritySettings();
    wordsString = settings.blockedWords || '';
  }

  if (!wordsString) return false;
  
  const words = wordsString
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
    
  if (words.length === 0) return false;

  const lower = content.toLowerCase();
  return words.some((word) => lower.includes(word));
}
