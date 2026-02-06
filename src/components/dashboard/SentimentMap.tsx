'use client';

import { useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import type { Tweet } from '@/lib/db/schema';

interface SentimentMapProps {
    tweets: Tweet[];
    maxPoints?: number;
}

interface DataPoint {
    x: number; // Time (minutes ago)
    y: number; // Sentiment score
    z: number; // Influence (follower count normalized)
    tweet: Tweet;
}

export function SentimentMap({ tweets, maxPoints = 100 }: SentimentMapProps) {
    const chartData = useMemo(() => {
        const now = Date.now();

        return tweets
            .filter((t) => t.sentiment)
            .slice(0, maxPoints)
            .map((tweet): DataPoint => {
                const minutesAgo = (now - new Date(tweet.createdAt).getTime()) / 60000;
                const influence = Math.log10(tweet.author.followerCount + 1) * 10;

                return {
                    x: Math.max(0, Math.min(60, minutesAgo)),
                    y: tweet.sentiment?.score || 0,
                    z: Math.min(influence, 50),
                    tweet,
                };
            });
    }, [tweets, maxPoints]);

    const getColor = (sentiment: number): string => {
        if (sentiment > 0.3) return 'oklch(0.8 0.22 145)'; // Green - positive
        if (sentiment < -0.3) return 'oklch(0.75 0.22 350)'; // Pink - negative
        return 'oklch(0.75 0.15 200)'; // Cyan - neutral
    };

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const tweet = data.tweet;

            return (
                <div className="glass-panel p-3 border border-border max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">@{tweet.author.username}</span>
                        {tweet.author.verified && (
                            <span className="text-neon-cyan text-xs">✓</span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {tweet.text}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                        <span className={data.y > 0.3 ? 'text-neon-green' : data.y < -0.3 ? 'text-neon-pink' : 'text-neon-cyan'}>
                            Sentiment: {data.y.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                            {Math.floor(data.x)}m ago
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Calculate sentiment distribution
    const distribution = useMemo(() => {
        const positive = chartData.filter((d) => d.y > 0.3).length;
        const negative = chartData.filter((d) => d.y < -0.3).length;
        const neutral = chartData.length - positive - negative;
        const total = chartData.length || 1;

        return {
            positive: Math.round((positive / total) * 100),
            neutral: Math.round((neutral / total) * 100),
            negative: Math.round((negative / total) * 100),
        };
    }, [chartData]);

    return (
        <div className="w-full h-full">
            {/* Distribution Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green" />
                    <span className="text-xs text-muted-foreground">Positive</span>
                    <span className="text-sm font-semibold text-neon-green">{distribution.positive}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                    <span className="text-xs text-muted-foreground">Neutral</span>
                    <span className="text-sm font-semibold text-neon-cyan">{distribution.neutral}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-pink" />
                    <span className="text-xs text-muted-foreground">Negative</span>
                    <span className="text-sm font-semibold text-neon-pink">{distribution.negative}%</span>
                </div>
            </div>

            {/* Scatter Plot */}
            <ResponsiveContainer width="100%" height={230}>
                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis
                        type="number"
                        dataKey="x"
                        name="Time"
                        domain={[0, 60]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'oklch(0.65 0.02 270)', fontSize: 10 }}
                        tickFormatter={(value) => `${value}m`}
                        reversed
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name="Sentiment"
                        domain={[-1, 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'oklch(0.65 0.02 270)', fontSize: 10 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[20, 200]} />

                    {/* Reference lines for sentiment zones */}
                    <ReferenceLine y={0} stroke="oklch(1 0 0 / 15%)" strokeWidth={1} />
                    <ReferenceLine y={0.3} stroke="oklch(0.8 0.22 145 / 30%)" strokeDasharray="3 3" />
                    <ReferenceLine y={-0.3} stroke="oklch(0.75 0.22 350 / 30%)" strokeDasharray="3 3" />

                    <Tooltip content={<CustomTooltip />} />

                    <Scatter data={chartData} fill="oklch(0.8 0.18 200)">
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getColor(entry.y)}
                                fillOpacity={0.7}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

// Demo data generator
export function generateDemoSentimentData(count: number = 50): Tweet[] {
    const categories = ['breaking_news', 'rumor', 'opinion', 'analysis'] as const;
    const usernames = ['newsbot', 'analyst1', 'trader_joe', 'breaking_alerts', 'market_watch'];

    return Array.from({ length: count }, (_, i) => ({
        id: `demo_${i}`,
        text: `Demo tweet ${i} with some content about markets and news.`,
        author: {
            id: `user_${i}`,
            username: usernames[i % usernames.length],
            displayName: `User ${i}`,
            avatarUrl: '',
            verified: i % 3 === 0,
            followerCount: Math.floor(Math.random() * 1000000),
        },
        metrics: {
            likes: Math.floor(Math.random() * 1000),
            retweets: Math.floor(Math.random() * 200),
            replies: Math.floor(Math.random() * 50),
            views: Math.floor(Math.random() * 50000),
        },
        createdAt: new Date(Date.now() - Math.random() * 3600000),
        source: 'mock' as const,
        sentiment: {
            score: (Math.random() * 2 - 1),
            label: (Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
            confidence: 0.7 + Math.random() * 0.3,
            keywords: ['market', 'news'],
            analyzedAt: new Date(),
        },
        category: categories[Math.floor(Math.random() * categories.length)],
        spamScore: Math.random() * 0.3,
        isFiltered: false,
    }));
}
