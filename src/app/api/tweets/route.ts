// GET /api/tweets
// Priority: NewsAPI → X API → mock data

import { NextResponse } from 'next/server';
import { isNewsApiConfigured, fetchNewsArticles, transformArticleToTweet } from '@/lib/api/news-api';
import { getXApiClient, transformXApiTweet, isXApiConfigured } from '@/lib/api/x-api';
import { generateMockTweet } from '@/lib/mock/tweet-generator';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'breaking OR market OR technology OR politics';
    const max = Math.min(parseInt(searchParams.get('max') || '20'), 50);

    // ── 1. NewsAPI (preferred – free tier) ───────────────────────────────────
    if (isNewsApiConfigured()) {
        try {
            const response = await fetchNewsArticles(query, { pageSize: max });

            if (response.status !== 'ok') {
                throw new Error(`NewsAPI returned status: ${response.status}`);
            }

            const tweets = response.articles.map(transformArticleToTweet);

            return NextResponse.json({
                tweets,
                source: 'newsapi',
                meta: { totalResults: response.totalResults, returned: tweets.length },
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[/api/tweets] NewsAPI error:', message);
            // Fall through to next option
        }
    }

    // ── 2. X API (optional, paid plan required) ───────────────────────────────
    if (isXApiConfigured()) {
        try {
            const client = getXApiClient()!;
            const response = await client.searchRecentTweets(query, max);
            const users = response.includes?.users ?? [];
            const tweets = (response.data ?? []).map((t) => transformXApiTweet(t, users));

            return NextResponse.json({ tweets, source: 'x_api', meta: response.meta });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[/api/tweets] X API error:', message);
            // Fall through to mock data
        }
    }

    // ── 3. Mock data fallback ─────────────────────────────────────────────────
    return NextResponse.json({
        tweets: Array.from({ length: max }, () => generateMockTweet()),
        source: 'mock',
        meta: { message: 'No API keys configured – using mock data.' },
    });
}
