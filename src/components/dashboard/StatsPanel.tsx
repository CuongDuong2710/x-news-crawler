'use client';

import { Activity, TrendingUp, Zap, Radio, Users, BarChart3 } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    color: 'cyan' | 'green' | 'orange' | 'pink' | 'purple';
}

export function StatCard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    color,
}: StatCardProps) {
    const colorClasses = {
        cyan: 'text-neon-cyan',
        green: 'text-neon-green',
        orange: 'text-neon-orange',
        pink: 'text-neon-pink',
        purple: 'text-neon-purple',
    };

    const changeColors = {
        positive: 'text-neon-green',
        negative: 'text-neon-pink',
        neutral: 'text-muted-foreground',
    };

    return (
        <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{title}</span>
                <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{value}</span>
                {change && (
                    <span className={`text-sm font-medium ${changeColors[changeType]}`}>
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
}

interface StatsPanelProps {
    tweetsAnalyzed: number;
    sentimentScore: number;
    activeTopics: number;
    alertsTriggered: number;
    connectedClients?: number;
    velocity?: number;
}

export function StatsPanel({
    tweetsAnalyzed,
    sentimentScore,
    activeTopics,
    alertsTriggered,
    connectedClients = 0,
    velocity = 0,
}: StatsPanelProps) {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getSentimentChange = (score: number): { text: string; type: 'positive' | 'negative' | 'neutral' } => {
        if (score > 0.3) return { text: '+' + score.toFixed(1), type: 'positive' };
        if (score < -0.3) return { text: score.toFixed(1), type: 'negative' };
        return { text: score.toFixed(1), type: 'neutral' };
    };

    const sentimentChange = getSentimentChange(sentimentScore);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
                title="Tweets Analyzed"
                value={formatNumber(tweetsAnalyzed)}
                icon={Activity}
                color="cyan"
            />
            <StatCard
                title="Sentiment Score"
                value={Math.abs(sentimentScore * 100).toFixed(0)}
                change={sentimentChange.text}
                changeType={sentimentChange.type}
                icon={TrendingUp}
                color="green"
            />
            <StatCard
                title="Active Topics"
                value={activeTopics}
                icon={Zap}
                color="orange"
            />
            <StatCard
                title="Alerts Triggered"
                value={alertsTriggered}
                icon={Radio}
                color="pink"
            />
            <StatCard
                title="Velocity"
                value={`${velocity}/min`}
                icon={BarChart3}
                color="purple"
            />
            <StatCard
                title="Connected"
                value={connectedClients}
                icon={Users}
                color="cyan"
            />
        </div>
    );
}
