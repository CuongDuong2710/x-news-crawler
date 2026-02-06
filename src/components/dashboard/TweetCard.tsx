'use client';

import { formatDistanceToNow } from 'date-fns';
import { Heart, Repeat2, MessageCircle, Eye, BadgeCheck, AlertTriangle } from 'lucide-react';
import type { Tweet } from '@/lib/db/schema';

interface TweetCardProps {
    tweet: Tweet;
    showAnalysis?: boolean;
    compact?: boolean;
}

export function TweetCard({ tweet, showAnalysis = true, compact = false }: TweetCardProps) {
    const getSentimentColor = (score: number): string => {
        if (score > 0.3) return 'text-neon-green';
        if (score < -0.3) return 'text-neon-pink';
        return 'text-neon-cyan';
    };

    const getCategoryBadge = (category: string | undefined) => {
        const badges: Record<string, { label: string; className: string }> = {
            breaking_news: { label: 'BREAKING', className: 'bg-neon-pink/20 text-neon-pink border-neon-pink/50' },
            rumor: { label: 'RUMOR', className: 'bg-neon-orange/20 text-neon-orange border-neon-orange/50' },
            opinion: { label: 'OPINION', className: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50' },
            analysis: { label: 'ANALYSIS', className: 'bg-neon-green/20 text-neon-green border-neon-green/50' },
            official: { label: 'OFFICIAL', className: 'bg-neon-purple/20 text-neon-purple border-neon-purple/50' },
        };
        return badges[category || ''];
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const categoryBadge = getCategoryBadge(tweet.category);
    const isSpam = (tweet.spamScore || 0) > 0.7;

    if (compact) {
        return (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                    {tweet.author.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">@{tweet.author.username}</span>
                        {tweet.author.verified && <BadgeCheck className="w-3.5 h-3.5 text-neon-cyan" />}
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{tweet.text}</p>
                </div>
                {tweet.sentiment && (
                    <div className={`text-xs font-medium ${getSentimentColor(tweet.sentiment.score)}`}>
                        {tweet.sentiment.score > 0 ? '+' : ''}{tweet.sentiment.score.toFixed(2)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`glass-panel p-4 ${isSpam ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-sm font-bold">
                        {tweet.author.username[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{tweet.author.displayName}</span>
                            {tweet.author.verified && (
                                <BadgeCheck className="w-4 h-4 text-neon-cyan" />
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>@{tweet.author.username}</span>
                            <span>•</span>
                            <span>{formatNumber(tweet.author.followerCount)} followers</span>
                        </div>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
                </span>
            </div>

            {/* Category Badge */}
            {categoryBadge && (
                <div className="mb-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${categoryBadge.className}`}>
                        {categoryBadge.label}
                    </span>
                </div>
            )}

            {/* Tweet Text */}
            <p className="text-sm leading-relaxed mb-4">{tweet.text}</p>

            {/* Metrics */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4" />
                    <span>{formatNumber(tweet.metrics.likes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Repeat2 className="w-4 h-4" />
                    <span>{formatNumber(tweet.metrics.retweets)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span>{formatNumber(tweet.metrics.replies)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{formatNumber(tweet.metrics.views)}</span>
                </div>
            </div>

            {/* AI Analysis */}
            {showAnalysis && tweet.sentiment && (
                <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Sentiment:</span>
                                <span className={`text-sm font-medium ${getSentimentColor(tweet.sentiment.score)}`}>
                                    {tweet.sentiment.label} ({tweet.sentiment.score.toFixed(2)})
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Confidence:</span>
                                <span className="text-sm">{Math.round(tweet.sentiment.confidence * 100)}%</span>
                            </div>
                        </div>
                        {isSpam && (
                            <div className="flex items-center gap-1.5 text-neon-orange">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs font-medium">Potential Spam</span>
                            </div>
                        )}
                    </div>
                    {tweet.sentiment.keywords.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Keywords:</span>
                            <div className="flex flex-wrap gap-1">
                                {tweet.sentiment.keywords.map((keyword, i) => (
                                    <span
                                        key={i}
                                        className="px-1.5 py-0.5 bg-secondary/50 rounded text-xs"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// List component for multiple tweets
interface TweetListProps {
    tweets: Tweet[];
    maxItems?: number;
    compact?: boolean;
}

export function TweetList({ tweets, maxItems = 10, compact = false }: TweetListProps) {
    return (
        <div className={compact ? 'divide-y divide-border' : 'space-y-4'}>
            {tweets.slice(0, maxItems).map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} compact={compact} />
            ))}
            {tweets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No tweets to display
                </div>
            )}
        </div>
    );
}
