'use client';

import React from 'react';

interface RichTextProps {
  content: string;
  linkColor?: string;
  textColor?: string;
  className?: string;
}

// URL regex that matches http(s), www, and common TLDs
const URL_REGEX =
  /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+)/gi;

// Parse text into segments: plain text and URLs
function parseContent(text: string): { type: 'text' | 'link'; value: string }[] {
  const segments: { type: 'text' | 'link'; value: string }[] = [];
  let lastIndex = 0;

  const matches = [...text.matchAll(URL_REGEX)];

  for (const match of matches) {
    const matchIndex = match.index!;
    // Add preceding text
    if (matchIndex > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, matchIndex) });
    }
    segments.push({ type: 'link', value: match[0] });
    lastIndex = matchIndex + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export function RichText({ content, linkColor = '#1877f2', textColor, className }: RichTextProps) {
  if (!content) return null;

  const segments = parseContent(content);

  return (
    <span className={className} style={{ color: textColor }}>
      {segments.map((segment, i) => {
        if (segment.type === 'link') {
          const href = segment.value.startsWith('http') ? segment.value : `https://${segment.value}`;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium hover:underline"
              style={{ color: linkColor }}
              onClick={(e) => e.stopPropagation()}
            >
              {segment.value}
            </a>
          );
        }
        return <React.Fragment key={i}>{segment.value}</React.Fragment>;
      })}
    </span>
  );
}

// Emoji Picker component
const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: [
      '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F606}', '\u{1F605}', '\u{1F602}', '\u{1F923}',
      '\u{1F60A}', '\u{1F607}', '\u{1F642}', '\u{1F643}', '\u{1F609}', '\u{1F60C}', '\u{1F60D}', '\u{1F970}',
      '\u{1F618}', '\u{1F617}', '\u{1F619}', '\u{1F61A}', '\u{1F60B}', '\u{1F61B}', '\u{1F61C}', '\u{1F92A}',
      '\u{1F61D}', '\u{1F911}', '\u{1F917}', '\u{1F92D}', '\u{1F92B}', '\u{1F914}', '\u{1F910}', '\u{1F928}',
      '\u{1F610}', '\u{1F611}', '\u{1F636}', '\u{1F60F}', '\u{1F612}', '\u{1F644}', '\u{1F62C}', '\u{1F925}',
      '\u{1F60E}', '\u{1F929}', '\u{1F973}', '\u{1F972}', '\u{1F974}', '\u{1F97A}', '\u{1F622}', '\u{1F62D}',
    ],
  },
  {
    name: 'Gestures',
    emojis: [
      '\u{1F44D}', '\u{1F44E}', '\u{1F44A}', '\u270C\uFE0F', '\u{1F91E}', '\u{1F44C}', '\u{1F448}', '\u{1F449}',
      '\u{1F446}', '\u{1F447}', '\u261D\uFE0F', '\u{1F44B}', '\u{1F91A}', '\u{1F590}\uFE0F', '\u{1F596}', '\u{1F64F}',
      '\u{1F4AA}', '\u{1F91D}', '\u270D\uFE0F', '\u{1F485}', '\u{1F933}', '\u{1F4A5}', '\u{1F4A4}', '\u{1F4AC}',
    ],
  },
  {
    name: 'Hearts',
    emojis: [
      '\u2764\uFE0F', '\u{1F9E1}', '\u{1F49B}', '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F90D}',
      '\u{1F90E}', '\u{1F494}', '\u{1F495}', '\u{1F49E}', '\u{1F493}', '\u{1F497}', '\u{1F496}', '\u{1F498}',
      '\u{1F49D}', '\u{1F49F}', '\u{1F48B}', '\u{1F48C}', '\u{1F4AF}', '\u{1F525}', '\u2B50', '\u{1F31F}',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '\u{1F389}', '\u{1F38A}', '\u{1F388}', '\u{1F381}', '\u{1F3C6}', '\u{1F947}', '\u{1F948}', '\u{1F949}',
      '\u26BD', '\u{1F3C0}', '\u{1F3C8}', '\u{1F3B5}', '\u{1F3B6}', '\u{1F3A4}', '\u{1F3A7}', '\u{1F4F7}',
      '\u{1F4F1}', '\u{1F4BB}', '\u{1F4A1}', '\u{1F4B0}', '\u{1F4B5}', '\u{1F4B8}', '\u{1F48E}', '\u{1F680}',
    ],
  },
  {
    name: 'Food',
    emojis: [
      '\u{1F354}', '\u{1F355}', '\u{1F32E}', '\u{1F32F}', '\u{1F37F}', '\u{1F366}', '\u{1F370}', '\u{1F382}',
      '\u{1F36B}', '\u{1F36C}', '\u{1F36D}', '\u{1F36E}', '\u2615', '\u{1F37A}', '\u{1F37B}', '\u{1F377}',
      '\u{1F34E}', '\u{1F34F}', '\u{1F34A}', '\u{1F34B}', '\u{1F34C}', '\u{1F349}', '\u{1F347}', '\u{1F353}',
    ],
  },
  {
    name: 'Animals',
    emojis: [
      '\u{1F436}', '\u{1F431}', '\u{1F42D}', '\u{1F439}', '\u{1F430}', '\u{1F98A}', '\u{1F43B}', '\u{1F43C}',
      '\u{1F428}', '\u{1F42F}', '\u{1F981}', '\u{1F434}', '\u{1F984}', '\u{1F41D}', '\u{1F98B}', '\u{1F422}',
      '\u{1F420}', '\u{1F433}', '\u{1F42C}', '\u{1F419}', '\u{1F40D}', '\u{1F985}', '\u{1F989}', '\u{1F99C}',
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  primaryColor?: string;
  cardColor?: string;
  textColor?: string;
  borderColor?: string;
  accentColor?: string;
}

export function EmojiPicker({ onSelect, primaryColor = '#1877f2', cardColor = '#ffffff', textColor = '#050505', borderColor = '#dddfe2', accentColor = '#e4e6eb' }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = React.useState(0);

  return (
    <div
      className="w-72 overflow-hidden rounded-lg shadow-lg"
      style={{ backgroundColor: cardColor, border: `1px solid ${borderColor}` }}
    >
      {/* Category tabs */}
      <div
        className="flex overflow-x-auto"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => setActiveCategory(i)}
            className="flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors"
            style={{
              color: i === activeCategory ? primaryColor : textColor,
              opacity: i === activeCategory ? 1 : 0.5,
              borderBottom: i === activeCategory ? `2px solid ${primaryColor}` : '2px solid transparent',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="grid max-h-48 grid-cols-8 gap-0 overflow-y-auto p-2">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-xl transition-colors hover:scale-110"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
