'use client';
import React, { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<any>(null);
  const [font, setFont] = useState<string>("system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        let appliedTheme = data?.theme;
        let appliedFont = font;
        if (data?.theme_json) {
          try {
            const parsed = JSON.parse(data.theme_json);
            if (parsed.colors) appliedTheme = { ...appliedTheme, ...parsed.colors };
            if (parsed.fonts?.body) appliedFont = parsed.fonts.body;
          } catch (e) {
            console.error("Failed to parse theme_json", e);
          }
        }
        if (appliedTheme) setTheme(appliedTheme);
        setFont(appliedFont);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      {theme && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --custom-bg: ${theme.background_color || '#0A0B10'};
              --custom-card: ${theme.card_color || '#13151c'};
              --custom-border: ${theme.border_color || '#1e1f2e'};
              --custom-text: ${theme.text_color || '#e8e8ed'};
              --custom-primary: ${theme.primary_color || '#4A7AFF'};
              --custom-success: ${theme.success_color || '#22c55e'};
              --custom-error: ${theme.error_color || '#e74c3c'};
              --custom-warning: ${theme.warning_color || '#f59e0b'};
              --custom-button-text: ${theme.button_text_color || '#ffffff'};
              --custom-font: ${font};
            }
            body {
              background-color: var(--custom-bg) !important;
              color: var(--custom-text) !important;
              font-family: var(--custom-font) !important;
            }
            .bg-\\[\\#0A0B10\\] { background-color: var(--custom-bg) !important; }
            .bg-\\[\\#13151c\\] { background-color: var(--custom-card) !important; }
            .bg-\\[\\#1e1f2e\\] { background-color: var(--custom-border) !important; }
            .border-\\[\\#1e1f2e\\] { border-color: var(--custom-border) !important; }
            .text-\\[\\#e8e8ed\\] { color: var(--custom-text) !important; }
            .text-\\[\\#e8e8ed\\]\\/70 { color: color-mix(in srgb, var(--custom-text) 70%, transparent) !important; }
            .text-\\[\\#e8e8ed\\]\\/50 { color: color-mix(in srgb, var(--custom-text) 50%, transparent) !important; }
            .text-\\[\\#e8e8ed\\]\\/40 { color: color-mix(in srgb, var(--custom-text) 40%, transparent) !important; }
            .text-\\[\\#e8e8ed\\]\\/30 { color: color-mix(in srgb, var(--custom-text) 30%, transparent) !important; }
            .text-\\[\\#4A7AFF\\] { color: var(--custom-primary) !important; }
            .bg-\\[\\#4A7AFF\\] { background-color: var(--custom-primary) !important; }
            .bg-\\[\\#4A7AFF\\]\\/10 { background-color: color-mix(in srgb, var(--custom-primary) 10%, transparent) !important; }
            .bg-\\[\\#4A7AFF\\]\\/15 { background-color: color-mix(in srgb, var(--custom-primary) 15%, transparent) !important; }
            .bg-\\[\\#4A7AFF\\]\\/20 { background-color: color-mix(in srgb, var(--custom-primary) 20%, transparent) !important; }
            .bg-\\[\\#4A7AFF\\]\\/30 { background-color: color-mix(in srgb, var(--custom-primary) 30%, transparent) !important; }
            .border-\\[\\#4A7AFF\\] { border-color: var(--custom-primary) !important; }
            .ring-\\[\\#4A7AFF\\] { --tw-ring-color: var(--custom-primary) !important; }
            
            .button-gradient {
              background: linear-gradient(135deg, var(--custom-primary) 0%, color-mix(in srgb, var(--custom-primary) 80%, black) 100%) !important;
              box-shadow: 0 4px 14px color-mix(in srgb, var(--custom-primary) 25%, transparent) !important;
              color: var(--custom-button-text, #ffffff) !important;
            }
            .button-gradient:hover {
              box-shadow: 0 6px 20px color-mix(in srgb, var(--custom-primary) 40%, transparent) !important;
            }
            
            .button-success {
              background: linear-gradient(135deg, var(--custom-success, #22c55e) 0%, color-mix(in srgb, var(--custom-success, #22c55e) 80%, black) 100%) !important;
              box-shadow: 0 4px 14px color-mix(in srgb, var(--custom-success, #22c55e) 25%, transparent) !important;
              color: var(--custom-button-text, #ffffff) !important;
            }
            .button-success:hover {
              box-shadow: 0 6px 20px color-mix(in srgb, var(--custom-success, #22c55e) 40%, transparent) !important;
            }

            .bg-\\[\\#22c55e\\] { background-color: var(--custom-success, #22c55e) !important; }
            .bg-\\[\\#22c55e\\]\\/10 { background-color: color-mix(in srgb, var(--custom-success, #22c55e) 10%, transparent) !important; }
            .bg-\\[\\#22c55e\\]\\/15 { background-color: color-mix(in srgb, var(--custom-success, #22c55e) 15%, transparent) !important; }
            .bg-\\[\\#22c55e\\]\\/20 { background-color: color-mix(in srgb, var(--custom-success, #22c55e) 20%, transparent) !important; }
            .bg-\\[\\#22c55e\\]\\/30 { background-color: color-mix(in srgb, var(--custom-success, #22c55e) 30%, transparent) !important; }
            .bg-\\[\\#22c55e\\]\\/80 { background-color: color-mix(in srgb, var(--custom-success, #22c55e) 80%, transparent) !important; }
            .text-\\[\\#22c55e\\] { color: var(--custom-success, #22c55e) !important; }
            .border-\\[\\#22c55e\\] { border-color: var(--custom-success, #22c55e) !important; }
            .ring-\\[\\#22c55e\\] { --tw-ring-color: var(--custom-success, #22c55e) !important; }

            .bg-\\[\\#e74c3c\\] { background-color: var(--custom-error, #e74c3c) !important; }
            .bg-\\[\\#e74c3c\\]\\/10 { background-color: color-mix(in srgb, var(--custom-error, #e74c3c) 10%, transparent) !important; }
            .bg-\\[\\#e74c3c\\]\\/20 { background-color: color-mix(in srgb, var(--custom-error, #e74c3c) 20%, transparent) !important; }
            .bg-\\[\\#e74c3c\\]\\/80 { background-color: color-mix(in srgb, var(--custom-error, #e74c3c) 80%, transparent) !important; }
            .text-\\[\\#e74c3c\\] { color: var(--custom-error, #e74c3c) !important; }
            .border-\\[\\#e74c3c\\] { border-color: var(--custom-error, #e74c3c) !important; }
            .hover\\:text-\\[\\#e74c3c\\]:hover { color: var(--custom-error, #e74c3c) !important; }
            .hover\\:bg-\\[\\#e74c3c\\]\\/20:hover { background-color: color-mix(in srgb, var(--custom-error, #e74c3c) 20%, transparent) !important; }

            .bg-\\[\\#f59e0b\\] { background-color: var(--custom-warning, #f59e0b) !important; }
            .bg-\\[\\#f59e0b\\]\\/15 { background-color: color-mix(in srgb, var(--custom-warning, #f59e0b) 15%, transparent) !important; }
            .bg-\\[\\#f59e0b\\]\\/20 { background-color: color-mix(in srgb, var(--custom-warning, #f59e0b) 20%, transparent) !important; }
            .text-\\[\\#f59e0b\\] { color: var(--custom-warning, #f59e0b) !important; }
            .hover\\:text-\\[\\#f59e0b\\]:hover { color: var(--custom-warning, #f59e0b) !important; }
            
            .bg-\\[\\#1e1f2e\\]\\/50 { background-color: color-mix(in srgb, var(--custom-border) 50%, transparent) !important; }
            .bg-\\[\\#1e1f2e\\]\\/80 { background-color: color-mix(in srgb, var(--custom-border) 80%, transparent) !important; }
            .bg-\\[\\#0A0B10\\]\\/50 { background-color: color-mix(in srgb, var(--custom-bg) 50%, transparent) !important; }
            .bg-\\[\\#13151c\\]\\/80 { background-color: color-mix(in srgb, var(--custom-card) 80%, transparent) !important; }
            .bg-\\[\\#13151c\\]\\/50 { background-color: color-mix(in srgb, var(--custom-card) 50%, transparent) !important; }
          `
        }} />
      )}
      {children}
    </>
  );
}
