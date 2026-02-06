'use client';

import { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { VelocitySnapshot } from '@/lib/db/schema';

interface VelocityChartProps {
    snapshots: VelocitySnapshot[];
    averageVelocity?: number;
    peakVelocity?: number;
    showSpikeLine?: boolean;
    spikeThreshold?: number;
}

export function VelocityChart({
    snapshots,
    averageVelocity = 0,
    peakVelocity = 0,
    showSpikeLine = true,
    spikeThreshold = 3,
}: VelocityChartProps) {
    const chartData = useMemo(() => {
        return snapshots.map((snapshot) => ({
            time: format(new Date(snapshot.timestamp), 'HH:mm'),
            timestamp: new Date(snapshot.timestamp).getTime(),
            count: snapshot.count,
            sentiment: snapshot.sentimentAvg,
        }));
    }, [snapshots]);

    const spikeLineValue = averageVelocity * spikeThreshold;

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-panel p-3 border border-border">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-neon-cyan">
                        <span className="text-muted-foreground">Tweets: </span>
                        {payload[0]?.value}
                    </p>
                    {payload[1] && (
                        <p className="text-sm text-neon-pink">
                            <span className="text-muted-foreground">Sentiment: </span>
                            {payload[1]?.value.toFixed(2)}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full">
            {/* Stats Header */}
            <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                    <span className="text-xs text-muted-foreground">Current</span>
                    <span className="text-sm font-semibold">
                        {snapshots[snapshots.length - 1]?.count || 0}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green" />
                    <span className="text-xs text-muted-foreground">Avg</span>
                    <span className="text-sm font-semibold">{averageVelocity.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-pink" />
                    <span className="text-xs text-muted-foreground">Peak</span>
                    <span className="text-sm font-semibold">{peakVelocity}</span>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.8 0.18 200)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="oklch(0.8 0.18 200)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(1 0 0 / 10%)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'oklch(0.65 0.02 270)', fontSize: 10 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'oklch(0.65 0.02 270)', fontSize: 10 }}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Spike threshold line */}
                    {showSpikeLine && spikeLineValue > 0 && (
                        <ReferenceLine
                            y={spikeLineValue}
                            stroke="oklch(0.65 0.25 25)"
                            strokeDasharray="5 5"
                            strokeWidth={1}
                            label={{
                                value: 'Spike Threshold',
                                fill: 'oklch(0.65 0.25 25)',
                                fontSize: 10,
                                position: 'right',
                            }}
                        />
                    )}

                    {/* Average line */}
                    {averageVelocity > 0 && (
                        <ReferenceLine
                            y={averageVelocity}
                            stroke="oklch(0.8 0.22 145)"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                        />
                    )}

                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="oklch(0.8 0.18 200)"
                        strokeWidth={2}
                        fill="url(#velocityGradient)"
                        dot={false}
                        activeDot={{
                            r: 4,
                            fill: 'oklch(0.8 0.18 200)',
                            stroke: 'oklch(0.12 0.01 270)',
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Demo data generator for development
export function generateDemoVelocityData(count: number = 30): VelocitySnapshot[] {
    const now = Date.now();
    const baseVelocity = 20;

    return Array.from({ length: count }, (_, i) => {
        // Simulate a spike around the middle
        const isSpike = i >= 15 && i <= 20;
        const velocity = isSpike
            ? baseVelocity * (3 + Math.random() * 2)
            : baseVelocity + Math.random() * 15 - 7;

        return {
            id: `snapshot_${i}`,
            timestamp: new Date(now - (count - i) * 60000),
            count: Math.max(1, Math.floor(velocity)),
            sentimentAvg: (Math.random() * 2 - 1) * 0.5,
            topCategories: [],
            topKeywords: [],
        };
    });
}
