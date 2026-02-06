'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';

interface NewsTickerProps {
    headlines: string[];
    speed?: number;
    showBreaking?: boolean;
}

export function NewsTicker({
    headlines,
    speed = 50,
    showBreaking = true,
}: NewsTickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Duplicate headlines for seamless loop
    const displayHeadlines = [...headlines, ...headlines];

    if (headlines.length === 0) {
        return (
            <div className="flex items-center gap-4 h-12">
                <BreakingBadge />
                <p className="text-muted-foreground text-sm">
                    Waiting for AI-generated headlines...
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-4 h-12 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {showBreaking && <BreakingBadge />}

            <div className="flex-1 overflow-hidden relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10" />

                <div
                    ref={containerRef}
                    className="flex items-center whitespace-nowrap"
                    style={{
                        animation: `ticker ${headlines.length * speed / 10}s linear infinite`,
                        animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                >
                    {displayHeadlines.map((headline, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center mx-8 text-sm"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan mr-3" />
                            {headline}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BreakingBadge() {
    return (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-neon-pink/20 border border-neon-pink/50 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-neon-pink animate-pulse" />
            <span className="text-xs font-bold text-neon-pink tracking-wider">
                BREAKING
            </span>
        </div>
    );
}

// Static news ticker for when live data isn't available
export function StaticNewsTicker() {
    const staticHeadlines = [
        "Market volatility increases amid global uncertainty",
        "Tech sector leads morning rally on AI optimism",
        "Breaking: Major policy announcement expected today",
        "Crypto markets stabilize after weekend fluctuations",
        "Analysts predict continued growth in Q2",
    ];

    return <NewsTicker headlines={staticHeadlines} />;
}

// Live ticker that updates with new headlines
interface LiveNewsTickerProps {
    maxHeadlines?: number;
}

export function LiveNewsTicker({ maxHeadlines = 10 }: LiveNewsTickerProps) {
    const [headlines, setHeadlines] = useState<string[]>([]);

    // This would connect to real-time headline generation
    // For now, uses static data
    useEffect(() => {
        setHeadlines([
            "Real-time sentiment analysis shows positive market outlook",
            "AI-powered news clustering identifies emerging trends",
            "Breaking news detection triggered for tech sector",
            "Social media velocity spike detected in crypto discussion",
        ]);
    }, []);

    return <NewsTicker headlines={headlines.slice(0, maxHeadlines)} />;
}
