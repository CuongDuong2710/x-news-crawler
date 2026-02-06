// Database Schema Definitions for X News Crawler
// This file defines TypeScript types that mirror the database structure
// For development, we use local state; for production, connect to Supabase

export interface Tweet {
    id: string;
    text: string;
    author: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        verified: boolean;
        followerCount: number;
    };
    metrics: {
        likes: number;
        retweets: number;
        replies: number;
        views: number;
    };
    createdAt: Date;
    source: 'api' | 'mock' | 'crawler';

    // AI-enriched fields
    sentiment?: SentimentAnalysis;
    category?: TweetCategory;
    spamScore?: number;
    isFiltered?: boolean;
}

export interface SentimentAnalysis {
    score: number; // -1 to 1 (negative to positive)
    label: 'positive' | 'negative' | 'neutral';
    confidence: number; // 0 to 1
    keywords: string[];
    analyzedAt: Date;
}

export type TweetCategory =
    | 'breaking_news'
    | 'rumor'
    | 'opinion'
    | 'analysis'
    | 'official'
    | 'spam'
    | 'unknown';

export interface Alert {
    id: string;
    name: string;
    enabled: boolean;
    conditions: AlertCondition[];
    actions: AlertAction[];
    createdAt: Date;
    lastTriggeredAt?: Date;
    triggerCount: number;
}

export interface AlertCondition {
    type: 'velocity_spike' | 'sentiment_shift' | 'keyword_match' | 'category_match';
    threshold?: number;
    keywords?: string[];
    categories?: TweetCategory[];
    windowMinutes?: number;
}

export interface AlertAction {
    type: 'discord_webhook' | 'in_app_notification' | 'email';
    webhookUrl?: string;
    email?: string;
}

export interface VelocitySnapshot {
    id: string;
    timestamp: Date;
    count: number;
    sentimentAvg: number;
    topCategories: { category: TweetCategory; count: number }[];
    topKeywords: { keyword: string; count: number }[];
}

// Supabase table definitions (for reference when setting up Supabase)
export const SUPABASE_TABLES = {
    tweets: `
    CREATE TABLE tweets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_username TEXT NOT NULL,
      author_display_name TEXT,
      author_avatar_url TEXT,
      author_verified BOOLEAN DEFAULT FALSE,
      author_follower_count INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      retweets INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL,
      source TEXT DEFAULT 'mock',
      sentiment_score FLOAT,
      sentiment_label TEXT,
      sentiment_confidence FLOAT,
      sentiment_keywords TEXT[],
      sentiment_analyzed_at TIMESTAMPTZ,
      category TEXT,
      spam_score FLOAT DEFAULT 0,
      is_filtered BOOLEAN DEFAULT FALSE,
      inserted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
    alerts: `
    CREATE TABLE alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      conditions JSONB NOT NULL,
      actions JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_triggered_at TIMESTAMPTZ,
      trigger_count INTEGER DEFAULT 0
    );
  `,
    velocity_snapshots: `
    CREATE TABLE velocity_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL,
      sentiment_avg FLOAT,
      top_categories JSONB,
      top_keywords JSONB
    );
  `,
} as const;

// Helper function to convert database row to Tweet type
export function rowToTweet(row: Record<string, unknown>): Tweet {
    return {
        id: row.id as string,
        text: row.text as string,
        author: {
            id: row.author_id as string,
            username: row.author_username as string,
            displayName: (row.author_display_name as string) || (row.author_username as string),
            avatarUrl: (row.author_avatar_url as string) || '',
            verified: row.author_verified as boolean,
            followerCount: row.author_follower_count as number,
        },
        metrics: {
            likes: row.likes as number,
            retweets: row.retweets as number,
            replies: row.replies as number,
            views: row.views as number,
        },
        createdAt: new Date(row.created_at as string),
        source: row.source as 'api' | 'mock' | 'crawler',
        sentiment: row.sentiment_score !== null ? {
            score: row.sentiment_score as number,
            label: row.sentiment_label as 'positive' | 'negative' | 'neutral',
            confidence: row.sentiment_confidence as number,
            keywords: row.sentiment_keywords as string[],
            analyzedAt: new Date(row.sentiment_analyzed_at as string),
        } : undefined,
        category: row.category as TweetCategory | undefined,
        spamScore: row.spam_score as number,
        isFiltered: row.is_filtered as boolean,
    };
}
