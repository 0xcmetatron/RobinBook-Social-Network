import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const title = html.match(/<title>([^<]+)<\/title>/i);

    return NextResponse.json({
      title: ogTitle?.[1] || title?.[1] || url,
      description: ogDescription?.[1] || '',
      image: ogImage?.[1] || '',
      url,
    });
  } catch {
    return NextResponse.json({
      title: url,
      description: '',
      image: '',
      url,
    });
  }
}
