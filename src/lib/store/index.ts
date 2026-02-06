import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { Tweet, Alert, VelocitySnapshot, TweetCategory } from '../db/schema';

// ============================================
// Tweet Store - Real-time tweet management
// ============================================
interface TweetState {
    tweets: Tweet[];
    isLoading: boolean;
    error: string | null;

    // Filters
    filters: {
        showSpam: boolean;
        showBots: boolean;
        minInfluence: number;
        categories: TweetCategory[];
        sentimentRange: [number, number];
    };

    // Actions
    addTweet: (tweet: Tweet) => void;
    addTweets: (tweets: Tweet[]) => void;
    updateTweet: (id: string, updates: Partial<Tweet>) => void;
    removeTweet: (id: string) => void;
    clearTweets: () => void;
    setFilters: (filters: Partial<TweetState['filters']>) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useTweetStore = create<TweetState>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            tweets: [],
            isLoading: false,
            error: null,

            filters: {
                showSpam: false,
                showBots: false,
                minInfluence: 0,
                categories: [],
                sentimentRange: [-1, 1],
            },

            addTweet: (tweet) => {
                set((state) => ({
                    tweets: [tweet, ...state.tweets].slice(0, 500), // Keep max 500 tweets
                }));
            },

            addTweets: (tweets) => {
                set((state) => ({
                    tweets: [...tweets, ...state.tweets].slice(0, 500),
                }));
            },

            updateTweet: (id, updates) => {
                set((state) => ({
                    tweets: state.tweets.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                }));
            },

            removeTweet: (id) => {
                set((state) => ({
                    tweets: state.tweets.filter((t) => t.id !== id),
                }));
            },

            clearTweets: () => set({ tweets: [] }),

            setFilters: (filters) => {
                set((state) => ({
                    filters: { ...state.filters, ...filters },
                }));
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
        })),
        { name: 'tweet-store' }
    )
);

// Selector for filtered tweets
export const useFilteredTweets = () => {
    return useTweetStore((state) => {
        const { tweets, filters } = state;

        return tweets.filter((tweet) => {
            // Filter by spam
            if (!filters.showSpam && tweet.spamScore && tweet.spamScore > 0.7) {
                return false;
            }

            // Filter by bots (low follower count + high activity could indicate bot)
            if (!filters.showBots && tweet.author.followerCount < 10) {
                return false;
            }

            // Filter by influence (follower count)
            if (tweet.author.followerCount < filters.minInfluence) {
                return false;
            }

            // Filter by categories
            if (filters.categories.length > 0 && tweet.category) {
                if (!filters.categories.includes(tweet.category)) {
                    return false;
                }
            }

            // Filter by sentiment range
            if (tweet.sentiment) {
                const score = tweet.sentiment.score;
                if (score < filters.sentimentRange[0] || score > filters.sentimentRange[1]) {
                    return false;
                }
            }

            return true;
        });
    });
};

// ============================================
// Velocity Store - Time-series data
// ============================================
interface VelocityState {
    snapshots: VelocitySnapshot[];
    currentVelocity: number;
    averageVelocity: number;
    peakVelocity: number;

    // Actions
    addSnapshot: (snapshot: VelocitySnapshot) => void;
    setSnapshots: (snapshots: VelocitySnapshot[]) => void;
    clearSnapshots: () => void;
}

export const useVelocityStore = create<VelocityState>()(
    devtools(
        (set, get) => ({
            snapshots: [],
            currentVelocity: 0,
            averageVelocity: 0,
            peakVelocity: 0,

            addSnapshot: (snapshot) => {
                set((state) => {
                    const newSnapshots = [...state.snapshots, snapshot].slice(-60); // Keep last 60 snapshots
                    const counts = newSnapshots.map((s) => s.count);
                    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
                    const peak = Math.max(...counts);

                    return {
                        snapshots: newSnapshots,
                        currentVelocity: snapshot.count,
                        averageVelocity: avg,
                        peakVelocity: peak,
                    };
                });
            },

            setSnapshots: (snapshots) => {
                const counts = snapshots.map((s) => s.count);
                const avg = counts.length > 0
                    ? counts.reduce((a, b) => a + b, 0) / counts.length
                    : 0;
                const peak = counts.length > 0 ? Math.max(...counts) : 0;
                const current = snapshots.length > 0
                    ? snapshots[snapshots.length - 1].count
                    : 0;

                set({
                    snapshots,
                    currentVelocity: current,
                    averageVelocity: avg,
                    peakVelocity: peak,
                });
            },

            clearSnapshots: () => set({
                snapshots: [],
                currentVelocity: 0,
                averageVelocity: 0,
                peakVelocity: 0,
            }),
        }),
        { name: 'velocity-store' }
    )
);

// ============================================
// Alert Store - Alert configuration
// ============================================
interface AlertState {
    alerts: Alert[];
    activeNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' }[];

    // Actions
    addAlert: (alert: Alert) => void;
    updateAlert: (id: string, updates: Partial<Alert>) => void;
    removeAlert: (id: string) => void;
    toggleAlert: (id: string) => void;
    addNotification: (notification: AlertState['activeNotifications'][0]) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

export const useAlertStore = create<AlertState>()(
    devtools(
        (set) => ({
            alerts: [],
            activeNotifications: [],

            addAlert: (alert) => {
                set((state) => ({
                    alerts: [...state.alerts, alert],
                }));
            },

            updateAlert: (id, updates) => {
                set((state) => ({
                    alerts: state.alerts.map((a) =>
                        a.id === id ? { ...a, ...updates } : a
                    ),
                }));
            },

            removeAlert: (id) => {
                set((state) => ({
                    alerts: state.alerts.filter((a) => a.id !== id),
                }));
            },

            toggleAlert: (id) => {
                set((state) => ({
                    alerts: state.alerts.map((a) =>
                        a.id === id ? { ...a, enabled: !a.enabled } : a
                    ),
                }));
            },

            addNotification: (notification) => {
                set((state) => ({
                    activeNotifications: [...state.activeNotifications, notification].slice(-10),
                }));
            },

            removeNotification: (id) => {
                set((state) => ({
                    activeNotifications: state.activeNotifications.filter((n) => n.id !== id),
                }));
            },

            clearNotifications: () => set({ activeNotifications: [] }),
        }),
        { name: 'alert-store' }
    )
);

// ============================================
// Dashboard Store - UI state
// ============================================
interface DashboardState {
    isLive: boolean;
    refreshInterval: number;
    selectedTimeRange: '5m' | '15m' | '30m' | '1h' | '6h' | '24h';
    sidebarOpen: boolean;

    // Actions
    setLive: (isLive: boolean) => void;
    setRefreshInterval: (interval: number) => void;
    setTimeRange: (range: DashboardState['selectedTimeRange']) => void;
    toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    devtools(
        (set) => ({
            isLive: true,
            refreshInterval: 5000, // 5 seconds
            selectedTimeRange: '1h',
            sidebarOpen: false,

            setLive: (isLive) => set({ isLive }),
            setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
            setTimeRange: (selectedTimeRange) => set({ selectedTimeRange }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        }),
        { name: 'dashboard-store' }
    )
);
