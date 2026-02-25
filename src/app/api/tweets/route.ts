// GET /api/tweets
// Priority: RSS (CoinGecko + DeFiLlama + extras) → NewsAPI → X API → mock

import { NextResponse } from 'next/server';
import { fetchAllRssFeeds, filterByKeywords } from '@/lib/api/rss-feeds';
import { isNewsApiConfigured, fetchNewsArticles, transformArticleToTweet } from '@/lib/api/news-api';
import { getXApiClient, transformXApiTweet, isXApiConfigured } from '@/lib/api/x-api';
import { generateMockTweet } from '@/lib/mock/tweet-generator';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'breaking OR market OR technology OR politics';
    const max = Math.min(parseInt(searchParams.get('max') || '20'), 50);

    // Which RSS sources to include (comma-separated ids, default: coingecko + defillama)
    const sources = (searchParams.get('sources') || 'defillama,coindesk,theblock,decrypt').split(',');

    // Optional: keyword filter derived from the topic preset
    const kwParam = searchParams.get('keywords') ?? '';
    const keywords = kwParam ? kwParam.split(',').filter(Boolean) : [];

    // ── 1. RSS feeds (always attempted – no API key needed) ────────────────────
    try {
        const { tweets, errors } = await fetchAllRssFeeds(sources, Math.ceil(max / sources.length) + 5);

        // Apply keyword filter if topic preset provided keywords
        const filtered = keywords.length ? filterByKeywords(tweets, keywords) : tweets;
        const sliced = filtered.slice(0, max);

        if (sliced.length > 0) {
            return NextResponse.json({
                tweets: sliced,
                source: 'rss',
                meta: {
                    sources,
                    returned: sliced.length,
                    errors: errors.length ? errors : undefined,
                },
            });
        }
        // If all feeds errored or returned nothing, fall through
        if (errors.length) {
            console.warn('[/api/tweets] RSS feeds had errors, trying fallbacks:', errors);
        }
    } catch (error: unknown) {
        console.error('[/api/tweets] RSS error:', error instanceof Error ? error.message : error);
    }

    // ── 2. NewsAPI ─────────────────────────────────────────────────────────────
    if (isNewsApiConfigured()) {
        try {
            const response = await fetchNewsArticles(query, { pageSize: max });
            if (response.status !== 'ok') throw new Error(`NewsAPI status: ${response.status}`);

            const tweets = response.articles.map(transformArticleToTweet);
            return NextResponse.json({
                tweets,
                source: 'newsapi',
                meta: { totalResults: response.totalResults, returned: tweets.length },
            });
        } catch (error: unknown) {
            console.error('[/api/tweets] NewsAPI error:', error instanceof Error ? error.message : error);
        }
    }

    // ── 3. X API ───────────────────────────────────────────────────────────────
    if (isXApiConfigured()) {
        try {
            const client = getXApiClient()!;
            const response = await client.searchRecentTweets(query, max);
            const users = response.includes?.users ?? [];
            const tweets = (response.data ?? []).map((t) => transformXApiTweet(t, users));
            return NextResponse.json({ tweets, source: 'x_api', meta: response.meta });
        } catch (error: unknown) {
            console.error('[/api/tweets] X API error:', error instanceof Error ? error.message : error);
        }
    }

    // ── 4. Mock fallback ───────────────────────────────────────────────────────
    return NextResponse.json({
        tweets: Array.from({ length: max }, () => generateMockTweet()),
        source: 'mock',
        meta: { message: 'All sources failed or unconfigured – using mock data.' },
    });
}
