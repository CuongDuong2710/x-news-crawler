// X API v2 Integration Structure
// This file provides the interface for connecting to the real X/Twitter API
// For development, use the mock data service instead

import type { Tweet, TweetCategory, SentimentAnalysis } from '../db/schema';

// ============================================
// Configuration
// ============================================

export interface XApiConfig {
    bearerToken: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessSecret?: string;
}

// Load config from environment
export function getXApiConfig(): XApiConfig | null {
    const bearerToken = process.env.X_BEARER_TOKEN;

    if (!bearerToken) {
        console.warn('⚠️ X API bearer token not configured. Using mock data.');
        return null;
    }

    return {
        bearerToken,
        apiKey: process.env.X_API_KEY,
        apiSecret: process.env.X_API_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_SECRET,
    };
}

// ============================================
// API Response Types (X API v2)
// ============================================

export interface XApiTweet {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
        impression_count: number;
    };
    entities?: {
        hashtags?: { tag: string }[];
        mentions?: { username: string }[];
        urls?: { expanded_url: string }[];
    };
}

export interface XApiUser {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
    verified: boolean;
    public_metrics: {
        followers_count: number;
        following_count: number;
        tweet_count: number;
    };
}

export interface XApiSearchResponse {
    data: XApiTweet[];
    includes?: {
        users: XApiUser[];
    };
    meta: {
        newest_id: string;
        oldest_id: string;
        result_count: number;
        next_token?: string;
    };
}

// ============================================
// API Client
// ============================================

export class XApiClient {
    private config: XApiConfig;
    private baseUrl = 'https://api.twitter.com/2';

    constructor(config: XApiConfig) {
        this.config = config;
    }

    private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.config.bearerToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`X API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async searchRecentTweets(query: string, maxResults: number = 10): Promise<XApiSearchResponse> {
        return this.fetch<XApiSearchResponse>('/tweets/search/recent', {
            query,
            max_results: maxResults.toString(),
            'tweet.fields': 'created_at,public_metrics,entities',
            'user.fields': 'name,username,profile_image_url,verified,public_metrics',
            expansions: 'author_id',
        });
    }

    async streamRules(): Promise<{ data: { id: string; value: string }[] }> {
        return this.fetch('/tweets/search/stream/rules');
    }

    async addStreamRule(value: string, tag?: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/tweets/search/stream/rules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.bearerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                add: [{ value, tag }],
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add stream rule: ${response.statusText}`);
        }
    }
}

// ============================================
// Transform Functions
// ============================================

export function transformXApiTweet(
    tweet: XApiTweet,
    users: XApiUser[]
): Omit<Tweet, 'sentiment' | 'category' | 'spamScore' | 'isFiltered'> {
    const author = users.find((u) => u.id === tweet.author_id);

    return {
        id: tweet.id,
        text: tweet.text,
        author: {
            id: author?.id || tweet.author_id,
            username: author?.username || 'unknown',
            displayName: author?.name || 'Unknown',
            avatarUrl: author?.profile_image_url || '',
            verified: author?.verified || false,
            followerCount: author?.public_metrics.followers_count || 0,
        },
        metrics: {
            likes: tweet.public_metrics.like_count,
            retweets: tweet.public_metrics.retweet_count,
            replies: tweet.public_metrics.reply_count,
            views: tweet.public_metrics.impression_count,
        },
        createdAt: new Date(tweet.created_at),
        source: 'api',
    };
}

// ============================================
// Factory Function
// ============================================

let clientInstance: XApiClient | null = null;

export function getXApiClient(): XApiClient | null {
    if (clientInstance) return clientInstance;

    const config = getXApiConfig();
    if (!config) return null;

    clientInstance = new XApiClient(config);
    return clientInstance;
}

export function isXApiConfigured(): boolean {
    return !!process.env.X_BEARER_TOKEN;
}
