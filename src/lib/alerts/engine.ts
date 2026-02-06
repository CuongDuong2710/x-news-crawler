// Alert Processing Engine
// Handles spike detection, sentiment correlation, and Discord webhook dispatch

import type { Tweet, Alert, AlertCondition, AlertAction, VelocitySnapshot, TweetCategory } from '../db/schema';

// ============================================
// Spike Detection
// ============================================

export interface SpikeDetectionResult {
    isSpike: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    percentageIncrease: number;
    currentCount: number;
    averageCount: number;
}

export function detectSpike(
    snapshots: VelocitySnapshot[],
    thresholdPercent: number = 300
): SpikeDetectionResult {
    if (snapshots.length < 2) {
        return {
            isSpike: false,
            severity: 'low',
            percentageIncrease: 0,
            currentCount: snapshots[0]?.count || 0,
            averageCount: 0,
        };
    }

    const recentCount = snapshots[snapshots.length - 1].count;
    const previousCounts = snapshots.slice(0, -1).map((s) => s.count);
    const averageCount = previousCounts.reduce((a, b) => a + b, 0) / previousCounts.length;

    if (averageCount === 0) {
        return {
            isSpike: recentCount > 10,
            severity: recentCount > 50 ? 'high' : recentCount > 20 ? 'medium' : 'low',
            percentageIncrease: 100,
            currentCount: recentCount,
            averageCount: 0,
        };
    }

    const percentageIncrease = ((recentCount - averageCount) / averageCount) * 100;
    const isSpike = percentageIncrease >= thresholdPercent;

    let severity: SpikeDetectionResult['severity'] = 'low';
    if (percentageIncrease >= 500) severity = 'critical';
    else if (percentageIncrease >= 400) severity = 'high';
    else if (percentageIncrease >= 300) severity = 'medium';

    return {
        isSpike,
        severity,
        percentageIncrease,
        currentCount: recentCount,
        averageCount,
    };
}

// ============================================
// Alert Condition Evaluation
// ============================================

export interface AlertContext {
    tweets: Tweet[];
    snapshots: VelocitySnapshot[];
    currentVelocity: number;
    averageVelocity: number;
}

export function evaluateCondition(condition: AlertCondition, context: AlertContext): boolean {
    switch (condition.type) {
        case 'velocity_spike': {
            const spike = detectSpike(context.snapshots, condition.threshold || 300);
            return spike.isSpike;
        }

        case 'sentiment_shift': {
            if (context.tweets.length < 10) return false;
            const recentTweets = context.tweets.slice(0, 20);
            const avgSentiment = recentTweets
                .filter((t) => t.sentiment)
                .reduce((sum, t) => sum + (t.sentiment?.score || 0), 0) / recentTweets.length;

            const threshold = condition.threshold || 0.5;
            return Math.abs(avgSentiment) >= threshold;
        }

        case 'keyword_match': {
            if (!condition.keywords?.length) return false;
            const recentTweets = context.tweets.slice(0, 50);
            const keywords = condition.keywords.map((k) => k.toLowerCase());

            return recentTweets.some((tweet) =>
                keywords.some((keyword) =>
                    tweet.text.toLowerCase().includes(keyword)
                )
            );
        }

        case 'category_match': {
            if (!condition.categories?.length) return false;
            const recentTweets = context.tweets.slice(0, 20);
            const matchCount = recentTweets.filter((t) =>
                t.category && condition.categories?.includes(t.category)
            ).length;

            return matchCount >= (condition.threshold || 5);
        }

        default:
            return false;
    }
}

export function evaluateAlert(alert: Alert, context: AlertContext): boolean {
    if (!alert.enabled) return false;

    // All conditions must be met (AND logic)
    return alert.conditions.every((condition) => evaluateCondition(condition, context));
}

// ============================================
// Discord Webhook
// ============================================

export interface DiscordMessage {
    content?: string;
    embeds?: Array<{
        title: string;
        description?: string;
        color?: number;
        fields?: Array<{ name: string; value: string; inline?: boolean }>;
        footer?: { text: string };
        timestamp?: string;
    }>;
}

export async function sendDiscordWebhook(
    webhookUrl: string,
    message: DiscordMessage
): Promise<boolean> {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        return response.ok;
    } catch (error) {
        console.error('Discord webhook error:', error);
        return false;
    }
}

// ============================================
// Alert Action Execution
// ============================================

export interface AlertTriggerData {
    alert: Alert;
    trigger: {
        type: string;
        details: string;
        tweets?: Tweet[];
        velocity?: number;
        sentiment?: number;
    };
    timestamp: Date;
}

export async function executeAction(
    action: AlertAction,
    data: AlertTriggerData
): Promise<boolean> {
    switch (action.type) {
        case 'discord_webhook': {
            if (!action.webhookUrl) return false;

            const color = data.trigger.type === 'velocity_spike' ? 0xff4444 : 0x3498db;

            const message: DiscordMessage = {
                embeds: [{
                    title: `🚨 Alert: ${data.alert.name}`,
                    description: data.trigger.details,
                    color,
                    fields: [
                        ...(data.trigger.velocity !== undefined ? [{
                            name: 'Velocity',
                            value: `${data.trigger.velocity} tweets/min`,
                            inline: true,
                        }] : []),
                        ...(data.trigger.sentiment !== undefined ? [{
                            name: 'Avg Sentiment',
                            value: data.trigger.sentiment.toFixed(2),
                            inline: true,
                        }] : []),
                        ...(data.trigger.tweets?.length ? [{
                            name: 'Sample Tweets',
                            value: data.trigger.tweets
                                .slice(0, 3)
                                .map((t) => `• @${t.author.username}: ${t.text.slice(0, 100)}...`)
                                .join('\n'),
                            inline: false,
                        }] : []),
                    ],
                    footer: { text: 'X News Crawler Alert System' },
                    timestamp: data.timestamp.toISOString(),
                }],
            };

            return sendDiscordWebhook(action.webhookUrl, message);
        }

        case 'in_app_notification': {
            // Would integrate with the notification store
            console.log('In-app notification:', data);
            return true;
        }

        case 'email': {
            // Email integration would go here
            console.log('Email notification:', data);
            return true;
        }

        default:
            return false;
    }
}

export async function triggerAlert(
    alert: Alert,
    context: AlertContext
): Promise<boolean> {
    const triggerData: AlertTriggerData = {
        alert,
        trigger: {
            type: 'velocity_spike',
            details: `Alert "${alert.name}" triggered based on configured conditions.`,
            tweets: context.tweets.slice(0, 5),
            velocity: context.currentVelocity,
            sentiment: context.tweets[0]?.sentiment?.score,
        },
        timestamp: new Date(),
    };

    const results = await Promise.all(
        alert.actions.map((action) => executeAction(action, triggerData))
    );

    return results.some((r) => r);
}

// ============================================
// Alert Engine
// ============================================

export class AlertEngine {
    private alerts: Alert[] = [];
    private context: AlertContext = {
        tweets: [],
        snapshots: [],
        currentVelocity: 0,
        averageVelocity: 0,
    };
    private checkInterval: NodeJS.Timeout | null = null;

    setAlerts(alerts: Alert[]): void {
        this.alerts = alerts;
    }

    updateContext(context: Partial<AlertContext>): void {
        this.context = { ...this.context, ...context };
    }

    async checkAlerts(): Promise<Alert[]> {
        const triggered: Alert[] = [];

        for (const alert of this.alerts) {
            if (evaluateAlert(alert, this.context)) {
                const success = await triggerAlert(alert, this.context);
                if (success) {
                    triggered.push(alert);
                }
            }
        }

        return triggered;
    }

    startMonitoring(intervalMs: number = 30000): void {
        this.stopMonitoring();
        this.checkInterval = setInterval(() => this.checkAlerts(), intervalMs);
    }

    stopMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Singleton instance
let alertEngine: AlertEngine | null = null;

export function getAlertEngine(): AlertEngine {
    if (!alertEngine) {
        alertEngine = new AlertEngine();
    }
    return alertEngine;
}
