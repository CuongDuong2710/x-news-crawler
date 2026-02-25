// RSS Feed client for crypto news sources
// Parses feeds from CoinGecko, DeFiLlama and other crypto-focused sources

import Parser from 'rss-parser';
import type { Tweet } from '../db/schema';

// ──────────────────────────────────────────────────────────────────────────────
// Feed definitions
// ──────────────────────────────────────────────────────────────────────────────

export interface FeedSource {
    id: string;
    name: string;
    url: string;
    followerCount: number; // default "influence" weight for articles
}

export const RSS_FEEDS: FeedSource[] = [
    {
        id: 'defillama',
        name: 'DeFiLlama',
        // DeFiLlama doesn't have its own RSS; they aggregate via their blog on Substack
        url: 'https://defillama.substack.com/feed',
        followerCount: 1_000_000,
    },
    // Bonus: supplement with these popular DeFi/crypto RSS feeds
    {
        id: 'coindesk',
        name: 'CoinDesk',
        url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
        followerCount: 3_000_000,
    },
    {
        id: 'theblock',
        name: 'The Block',
        url: 'https://www.theblock.co/rss.xml',
        followerCount: 800_000,
    },
    {
        id: 'decrypt',
        name: 'Decrypt',
        url: 'https://decrypt.co/feed',
        followerCount: 600_000,
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// Fetch + parse a single RSS feed
// ──────────────────────────────────────────────────────────────────────────────

const parser = new Parser({
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; XNewsCrawler/1.0)' },
});

let _idCounter = 0;

export async function fetchRssFeed(source: FeedSource, limit = 20): Promise<Tweet[]> {
    const feed = await parser.parseURL(source.url);

    return (feed.items ?? [])
        .slice(0, limit)
        .map((item) => {
            const username = source.name.toLowerCase().replace(/\s+/g, '_');
            const text = item.title
                ? item.contentSnippet
                    ? `${item.title} — ${item.contentSnippet.slice(0, 200)}`
                    : item.title
                : item.contentSnippet ?? '(no content)';

            return {
                id: `rss_${source.id}_${item.guid ?? item.link ?? _idCounter++}`,
                text: text.slice(0, 280),
                author: {
                    id: `rss_${source.id}`,
                    username,
                    displayName: source.name,
                    avatarUrl: feed.image?.url ?? '',
                    verified: true,
                    followerCount: source.followerCount,
                },
                metrics: { likes: 0, retweets: 0, replies: 0, views: 0 },
                createdAt: item.isoDate ? new Date(item.isoDate) : new Date(),
                source: 'api' as const,
            };
        });
}

// ──────────────────────────────────────────────────────────────────────────────
// Fetch all configured feeds in parallel, return merged + sorted results
// ──────────────────────────────────────────────────────────────────────────────

export async function fetchAllRssFeeds(
    sourceIds: string[] = ['defillama', 'coindesk', 'theblock', 'decrypt'],
    limit = 10
): Promise<{ tweets: Tweet[]; errors: string[] }> {
    const sources = RSS_FEEDS.filter((f) => sourceIds.includes(f.id));

    const results = await Promise.allSettled(
        sources.map((s) => fetchRssFeed(s, limit))
    );

    const tweets: Tweet[] = [];
    const errors: string[] = [];

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            tweets.push(...result.value);
        } else {
            const msg = `${sources[i].name}: ${result.reason?.message ?? 'unknown error'}`;
            errors.push(msg);
            console.error(`[RSS] ${msg}`);
        }
    });

    // Sort newest first
    tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { tweets, errors };
}

// Keyword-based search filter (applied client-side after fetching)
export function filterByKeywords(tweets: Tweet[], keywords: string[]): Tweet[] {
    if (!keywords.length) return tweets;
    const lower = keywords.map((k) => k.toLowerCase());
    return tweets.filter((t) =>
        lower.some((kw) => t.text.toLowerCase().includes(kw))
    );
}
