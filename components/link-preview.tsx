'use client';

import React, { useEffect, useState } from 'react';

interface PreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
}

const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+)/gi;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  return matches.map((u) => (u.startsWith('http') ? u : `https://${u}`));
}

export function LinkPreview({ url, compact }: { url: string; compact?: boolean }) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className={`rounded-xl border border-[#1e1f2e] bg-[#0A0B10]/50 animate-pulse ${compact ? 'mt-1 p-2' : 'mt-2 p-3'}`}>
        <div className={`rounded bg-[#1e1f2e] ${compact ? 'h-2 w-3/4' : 'h-3 w-3/4'}`} />
        {!compact && <div className="mt-2 h-2 w-1/2 rounded bg-[#1e1f2e]" />}
      </div>
    );
  }

  if (!data) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block overflow-hidden rounded-xl border border-[#1e1f2e] bg-[#0A0B10]/50 hover:bg-[#1e1f2e]/50 transition-all group ${compact ? 'mt-1' : 'mt-2'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {data.image && !compact && (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={data.image}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div className={compact ? 'p-2' : 'p-3'}>
        <p className={`font-semibold text-[#e8e8ed] group-hover:text-[#4A7AFF] transition-colors line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {data.title}
        </p>
        {data.description && !compact && (
          <p className="mt-1 text-xs text-[#e8e8ed]/50 line-clamp-2">
            {data.description}
          </p>
        )}
        <p className={`mt-0.5 text-[#e8e8ed]/30 truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {new URL(data.url).hostname}
        </p>
      </div>
    </a>
  );
}
