// NewsAPI.org client
// Docs: https://newsapi.org/docs/endpoints/everything
// Free tier: 100 requests/day, developer use only (localhost)
// Sign up for a free key at: https://newsapi.org/register

import type { Tweet } from '../db/schema';

const BASE_URL = 'https://newsapi.org/v2';

export interface NewsApiArticle {
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

export interface NewsApiResponse {
    status: string;
    totalResults: number;
    articles: NewsApiArticle[];
}

export function isNewsApiConfigured(): boolean {
    return !!process.env.NEWSAPI_KEY;
}

export async function fetchNewsArticles(
    query: string = 'breaking news OR market OR technology',
    options: { pageSize?: number; language?: string } = {}
): Promise<NewsApiResponse> {
    const key = process.env.NEWSAPI_KEY;
    if (!key) throw new Error('NEWSAPI_KEY is not set');

    const { pageSize = 20, language = 'en' } = options;

    const url = new URL(`${BASE_URL}/everything`);
    url.searchParams.set('q', query);
    url.searchParams.set('language', language);
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', String(Math.min(pageSize, 100)));
    url.searchParams.set('apiKey', key);

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`NewsAPI ${res.status}: ${body}`);
    }

    return res.json();
}

// ──────────────────────────────────────────────
// Transform a NewsAPI article → our Tweet shape
// ──────────────────────────────────────────────

let _idCounter = 0;

export function transformArticleToTweet(article: NewsApiArticle): Tweet {
    // Use source name as the "author" username
    const sourceName = article.source.name || 'Unknown';
    const username = sourceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Compose tweet text from title + description
    const text = article.title
        ? article.description
            ? `${article.title} — ${article.description}`
            : article.title
        : article.description ?? '(no content)';

    return {
        id: `newsapi_${article.publishedAt}_${_idCounter++}`,
        text: text.slice(0, 280), // keep tweet-length
        author: {
            id: `src_${username}`,
            username,
            displayName: sourceName,
            avatarUrl: article.urlToImage ?? '',
            verified: true,          // news outlets → treated as verified
            followerCount: 100_000,  // default influence weight
        },
        metrics: {
            likes: 0,
            retweets: 0,
            replies: 0,
            views: 0,
        },
        createdAt: new Date(article.publishedAt),
        source: 'api',
    };
}
