'use client';

import { useState } from 'react';
import { useTweetStore } from '@/lib/store';
import type { TweetCategory } from '@/lib/db/schema';

// ──────────────────────────────────────────────────────────────────────────────
// Topic presets – each maps to a NewsAPI `q` query string
// ──────────────────────────────────────────────────────────────────────────────
export interface TopicPreset {
    id: string;
    label: string;
    emoji: string;
    color: string;        // Tailwind colour token (without `text-` / `bg-` prefix)
    query: string;        // NewsAPI `q` value
    keywords: string[];   // client-side keyword highlights
}

export const TOPIC_PRESETS: TopicPreset[] = [
    {
        id: 'all',
        label: 'All News',
        emoji: '🌐',
        color: 'neon-cyan',
        query: 'breaking OR market OR technology OR politics',
        keywords: [],
    },
    {
        id: 'crypto',
        label: 'Crypto',
        emoji: '🪙',
        color: 'neon-orange',
        query: 'crypto OR cryptocurrency OR bitcoin OR ethereum OR altcoin',
        keywords: ['crypto', 'bitcoin', 'ethereum', 'btc', 'eth', 'altcoin'],
    },
    {
        id: 'blockchain',
        label: 'Blockchain',
        emoji: '⛓️',
        color: 'neon-purple',
        query: 'blockchain OR "web3" OR "DeFi" OR "NFT" OR "smart contract"',
        keywords: ['blockchain', 'web3', 'defi', 'nft', 'smart contract'],
    },
    {
        id: 'airdrop',
        label: 'Airdrop',
        emoji: '🪂',
        color: 'neon-green',
        query: 'airdrop OR "token airdrop" OR "crypto airdrop" OR retroactive',
        keywords: ['airdrop', 'retroactive', 'eligible', 'claim', 'snapshot'],
    },
    {
        id: 'whitelist',
        label: 'Whitelist / WL',
        emoji: '📋',
        color: 'neon-pink',
        query: 'whitelist OR "whitelist hunt" OR "WL spots" OR "allowlist" OR "mint pass"',
        keywords: ['whitelist', 'wl', 'allowlist', 'mint', 'pass'],
    },
    {
        id: 'new_projects',
        label: 'New Projects',
        emoji: '🚀',
        color: 'neon-cyan',
        query: '"new project" OR "project launch" OR "token launch" OR IDO OR ICO OR "pre-sale"',
        keywords: ['launch', 'ido', 'ico', 'presale', 'pre-sale', 'new project'],
    },
    {
        id: 'retroactive',
        label: 'Retroactive',
        emoji: '⏮️',
        color: 'neon-orange',
        query: 'retroactive OR "retroactive reward" OR "retro drop" OR "retrospective airdrop"',
        keywords: ['retroactive', 'retro', 'retrospective', 'reward'],
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// SignalFilter component
// ──────────────────────────────────────────────────────────────────────────────
interface SignalFilterProps {
    onFilterChange?: () => void;
    /** Called when user picks a topic preset – passes the NewsAPI query string */
    onTopicChange?: (query: string, preset: TopicPreset) => void;
}

export function SignalFilter({ onFilterChange, onTopicChange }: SignalFilterProps) {
    const { filters, setFilters } = useTweetStore();
    const [activeTopic, setActiveTopic] = useState<string>('all');

    const handleToggle = (key: 'showSpam' | 'showBots') => {
        setFilters({ [key]: !filters[key] });
        onFilterChange?.();
    };

    const handleInfluenceChange = (value: number) => {
        setFilters({ minInfluence: value });
        onFilterChange?.();
    };

    const handleCategoryToggle = (category: TweetCategory) => {
        const current = filters.categories;
        const updated = current.includes(category)
            ? current.filter((c) => c !== category)
            : [...current, category];
        setFilters({ categories: updated });
        onFilterChange?.();
    };

    const handleTopicSelect = (preset: TopicPreset) => {
        setActiveTopic(preset.id);
        onTopicChange?.(preset.query, preset);
    };

    const categories: { key: TweetCategory; label: string; color: string }[] = [
        { key: 'breaking_news', label: 'Breaking', color: 'bg-neon-pink' },
        { key: 'rumor', label: 'Rumor', color: 'bg-neon-orange' },
        { key: 'opinion', label: 'Opinion', color: 'bg-neon-cyan' },
        { key: 'analysis', label: 'Analysis', color: 'bg-neon-green' },
        { key: 'official', label: 'Official', color: 'bg-neon-purple' },
    ];

    const influenceLevels = [
        { value: 0, label: 'All' },
        { value: 1000, label: '1K+' },
        { value: 10000, label: '10K+' },
        { value: 100000, label: '100K+' },
        { value: 1000000, label: '1M+' },
    ];

    return (
        <div className="space-y-6">

            {/* ── Topic Presets ──────────────────────────────────────────────── */}
            <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    Topic Preset
                </h3>
                <div className="flex flex-wrap gap-2">
                    {TOPIC_PRESETS.map((preset) => {
                        const isActive = activeTopic === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => handleTopicSelect(preset)}
                                title={preset.query}
                                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${isActive
                                        ? `bg-${preset.color}/20 border-${preset.color}/70 text-${preset.color}`
                                        : 'bg-secondary/30 border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }
                `}
                            >
                                <span>{preset.emoji}</span>
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Signal vs Noise ───────────────────────────────────────────── */}
            <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    Signal / Noise
                </h3>
                <div className="space-y-2">
                    <ToggleButton
                        label="Show Spam"
                        description="Include potential spam content"
                        active={filters.showSpam}
                        activeColor="bg-neon-pink/20 border-neon-pink"
                        onClick={() => handleToggle('showSpam')}
                    />
                    <ToggleButton
                        label="Show Bots"
                        description="Include suspected bot accounts"
                        active={filters.showBots}
                        activeColor="bg-neon-orange/20 border-neon-orange"
                        onClick={() => handleToggle('showBots')}
                    />
                </div>
            </div>

            {/* ── Min Followers ─────────────────────────────────────────────── */}
            <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    Min Followers
                </h3>
                <div className="flex flex-wrap gap-2">
                    {influenceLevels.map((level) => (
                        <button
                            key={level.value}
                            onClick={() => handleInfluenceChange(level.value)}
                            className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filters.minInfluence === level.value
                                    ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                                    : 'bg-secondary/50 border border-transparent text-muted-foreground hover:bg-secondary'
                                }
              `}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content Categories ────────────────────────────────────────── */}
            <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                        const isActive = filters.categories.length === 0 || filters.categories.includes(cat.key);
                        return (
                            <button
                                key={cat.key}
                                onClick={() => handleCategoryToggle(cat.key)}
                                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                                        ? `${cat.color}/20 border border-current`
                                        : 'bg-secondary/30 border border-transparent text-muted-foreground/50'
                                    }
                `}
                                style={{ color: isActive ? `var(--${cat.color.replace('bg-', '')})` : undefined }}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
                {filters.categories.length > 0 && (
                    <button
                        onClick={() => setFilters({ categories: [] })}
                        className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* ── Sentiment Range ───────────────────────────────────────────── */}
            <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    Sentiment Range
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neon-pink">-1</span>
                    <div className="flex-1 h-2 bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-green rounded-full opacity-60" />
                    <span className="text-xs text-neon-green">+1</span>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Toggle Button
// ──────────────────────────────────────────────────────────────────────────────
interface ToggleButtonProps {
    label: string;
    description?: string;
    active: boolean;
    activeColor: string;
    onClick: () => void;
}

function ToggleButton({ label, description, active, activeColor, onClick }: ToggleButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center justify-between p-3 rounded-lg border transition-all
        ${active ? activeColor : 'bg-secondary/30 border-transparent hover:bg-secondary/50'}
      `}
        >
            <div className="text-left">
                <span className="text-sm font-medium">{label}</span>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${active ? 'bg-neon-cyan' : 'bg-muted'}`}>
                <div className={`w-4 h-4 rounded-full bg-background transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </button>
    );
}
