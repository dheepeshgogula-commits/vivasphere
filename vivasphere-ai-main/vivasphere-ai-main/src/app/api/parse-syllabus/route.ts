import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let text = (body.text || '').trim();
    const url = (body.url || '').trim();

    let detectedTopic = '';
    let sourceType: 'file' | 'youtube' | 'link' | 'text' = 'text';

    // ── 1. If a URL is provided (YouTube, PDF link, Web page) ──
    if (url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        sourceType = 'youtube';
        try {
          // Use YouTube official public oEmbed endpoint
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
            signal: AbortSignal.timeout(5000)
          });
          if (oembedRes.ok) {
            const oembed = await oembedRes.json();
            const videoTitle = oembed.title || 'YouTube Technical Lecture';
            const author = oembed.author_name || '';
            detectedTopic = videoTitle;
            text = `YouTube Lecture: "${videoTitle}" by ${author}. In-depth technical breakdown covering core algorithms, architectural principles, edge cases, implementation trade-offs, and practical engineering patterns.`;
          }
        } catch {
          // Fallback if oembed times out
          detectedTopic = 'YouTube Technical Lecture';
          text = `YouTube Video Lecture on ${url}. Technical analysis of algorithms, data structures, protocols, and implementation.`;
        }
      } else {
        sourceType = 'link';
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(6000)
          });

          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            const raw = await res.text();

            if (contentType.includes('html')) {
              // Extract Title
              const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
              const pageTitle = titleMatch 
                ? titleMatch[1].replace(/\s*[-|•]\s*(?:Wikipedia|YouTube|GeeksforGeeks|Medium|Documentation).*$/i, '').trim() 
                : '';

              // Extract Meta Description
              const descMatch = raw.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                                raw.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
              const pageDesc = descMatch ? descMatch[1] : '';

              // Strip HTML tags & scripts to gather readable content
              const bodyText = raw
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&[a-z]+;/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();

              if (pageTitle && pageTitle.length > 2) detectedTopic = pageTitle;
              text = `${pageTitle ? pageTitle + '. ' : ''}${pageDesc ? pageDesc + '. ' : ''}${bodyText.substring(0, 6000)}`;
            } else {
              // Plain text or raw content
              text = raw.substring(0, 6000);
            }
          }
        } catch {
          // If fetch fails (CORS/forbidden), infer topic from URL path
          try {
            const urlObj = new URL(url);
            const segments = urlObj.pathname.split('/').filter(Boolean);
            const last = segments[segments.length - 1] || urlObj.hostname;
            detectedTopic = decodeURIComponent(last).replace(/[-_.]/g, ' ').replace(/\.pdf$/i, '');
            text = `Technical study document on ${detectedTopic}. Core concepts, system architecture, invariants, and problem-solving methodologies.`;
          } catch {
            detectedTopic = 'Web Technical Resource';
            text = `Web resource at ${url}.`;
          }
        }
      }
    } else {
      sourceType = 'file';
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No content or link provided to parse'
      }, { status: 400 });
    }

    const lower = text.toLowerCase();

    // ── Infer / refine topic if not already extracted from title ──
    if (!detectedTopic) {
      if (lower.includes('deadlock') || lower.includes('paging') || lower.includes('kernel') || lower.includes('operating system')) {
        detectedTopic = 'Operating Systems';
      } else if (lower.includes('sql') || lower.includes('database') || lower.includes('b-tree') || lower.includes('acid') || lower.includes('dbms')) {
        detectedTopic = 'Database Management Systems';
      } else if (lower.includes('tcp') || lower.includes('udp') || lower.includes('router') || lower.includes('network')) {
        detectedTopic = 'Computer Networks';
      } else if (lower.includes('dynamic programming') || lower.includes('graph') || lower.includes('binary search') || lower.includes('dijkstra')) {
        detectedTopic = 'Data Structures & Algorithms';
      } else if (lower.includes('microservices') || lower.includes('distributed') || lower.includes('raft') || lower.includes('paxos')) {
        detectedTopic = 'Distributed Systems & Architecture';
      } else {
        // Extract first significant capitalised heading
        const headingMatch = text.match(/^(?:#+\s*|Unit\s*\d*[\s:\-]+|Module\s*\d*[\s:\-]+)?([A-Z][A-Za-z\s]{3,40})/m);
        detectedTopic = headingMatch ? headingMatch[1].trim() : 'Custom Technical Syllabus';
      }
    }

    // ── Difficulty hint ──
    let suggestedDifficulty: 'Beginner' | 'Intermediate' | 'Expert' = 'Intermediate';
    if (lower.includes('distributed') || lower.includes('kernel') || lower.includes('concurrency') || lower.includes('advanced') || lower.includes('senior') || lower.includes('graduate')) {
      suggestedDifficulty = 'Expert';
    } else if (lower.includes('introduction') || lower.includes('basics') || lower.includes('fundamentals') || lower.includes('101')) {
      suggestedDifficulty = 'Beginner';
    }

    // ── Extract key technical terms ──
    const conceptRegex = /\b([A-Z][a-zA-Z]{3,25}(?:\s+[A-Z][a-zA-Z]{3,25})*)\b/g;
    const candidates = text.match(conceptRegex) || [];
    const stopWords = new Set(['This', 'That', 'With', 'From', 'Have', 'More', 'Some', 'When', 'What', 'Which', 'Then', 'They', 'These', 'Those', 'There', 'Their', 'YouTube', 'Wikipedia', 'About', 'After', 'Before']);

    const conceptSet = new Set<string>();
    candidates.forEach((c: string) => {
      const clean = c.trim();
      if (clean.length > 3 && clean.length < 35 && !stopWords.has(clean)) {
        conceptSet.add(clean);
      }
    });

    const matchedConcepts = Array.from(conceptSet).slice(0, 15);

    return NextResponse.json({
      success: true,
      detectedTopic,
      sourceType,
      text: text.substring(0, 8000), // return clean text so client can store it
      suggestedDifficulty,
      matchedConcepts: matchedConcepts.length > 0 ? matchedConcepts : [detectedTopic, 'Core Foundations', 'System Architecture'],
      wordCount: text.split(/\s+/).filter(Boolean).length
    });
  } catch (error) {
    console.error('Error parsing content:', error);
    return NextResponse.json({ success: false, error: 'Failed to parse custom resource' }, { status: 500 });
  }
}
