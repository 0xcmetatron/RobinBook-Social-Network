'use client';

import { useEffect, useState } from 'react';

interface Theme {
  text_color: string;
  border_color: string;
  background_color: string;
}

export function Footer() {
  const [settings, setSettings] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>({
    text_color: '#e8e8ed',
    border_color: '#1e1f2e',
    background_color: '#0A0B10',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.theme) {
          setTheme({
            text_color: data.theme.text_color || '#e8e8ed',
            border_color: data.theme.border_color || '#1e1f2e',
            background_color: data.theme.background_color || '#0A0B10',
          });
        }
      }
    } catch {
      // Use defaults
    }
  };

  const copyrightText = settings?.copyright_text || '© 2026 Black Social Network. All rights reserved.';
  const twitterUrl = settings?.twitter_url || '';

  return (
    <footer
      className="mt-auto py-6 pb-24"
      style={{ borderTop: `1px solid ${theme.border_color}` }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p className="text-sm" style={{ color: theme.text_color, opacity: 0.5 }}>
          {copyrightText}
        </p>

        {twitterUrl && (
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: theme.text_color, opacity: 0.6 }}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow us on X
          </a>
        )}
      </div>
    </footer>
  );
}