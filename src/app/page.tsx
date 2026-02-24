'use client';

import { useState, useEffect, useCallback } from 'react';
import { Radio, TrendingUp, Activity, Zap, Settings, Bell } from 'lucide-react';
import {
  VelocityChart,
  SentimentMap,
  SignalFilter,
  StaticNewsTicker,
  TweetList,
  StatsPanel,
  AlertConfig,
  NotificationCenter,
  generateDemoVelocityData,
} from '@/components/dashboard';
import { useDashboardStore } from '@/lib/store';
import type { Tweet } from '@/lib/db/schema';
import type { VelocitySnapshot } from '@/lib/db/schema';

export default function Home() {
  const { isLive, setLive } = useDashboardStore();

  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [velocityData, setVelocityData] = useState<VelocitySnapshot[]>(generateDemoVelocityData(30));
  const [dataSource, setDataSource] = useState<'newsapi' | 'x_api' | 'mock'>('mock');
  const [stats, setStats] = useState({
    tweetsAnalyzed: 0,
    sentimentScore: 0,
    activeTopics: 0,
    alertsTriggered: 0,
    velocity: 0,
    connected: 1,
  });

  // Fetch tweets from our API route (which uses real X API or mock)
  const fetchTweets = useCallback(async () => {
    try {
      const res = await fetch('/api/tweets?max=20');
      if (!res.ok) return;
      const data = await res.json();

      const newTweets: Tweet[] = data.tweets;
      setDataSource(data.source);

      setTweets((prev) => {
        // Merge: prepend new tweets, deduplicate by id, cap at 100
        const ids = new Set(prev.map((t) => t.id));
        const fresh = newTweets.filter((t) => !ids.has(t.id));
        return [...fresh, ...prev].slice(0, 100);
      });

      // Compute sentiment average from the latest batch
      const withSentiment = newTweets.filter((t) => t.sentiment);
      const avgSentiment =
        withSentiment.length > 0
          ? withSentiment.reduce((s, t) => s + (t.sentiment?.score ?? 0), 0) /
          withSentiment.length
          : 0;

      // Update velocity
      const newSnapshot: VelocitySnapshot = {
        id: `snap_${Date.now()}`,
        timestamp: new Date(),
        count: newTweets.length,
        sentimentAvg: avgSentiment,
        topCategories: [],
        topKeywords: [],
      };

      setVelocityData((prev) => [...prev.slice(-59), newSnapshot]);

      setStats((prev) => ({
        ...prev,
        tweetsAnalyzed: prev.tweetsAnalyzed + newTweets.length,
        sentimentScore: avgSentiment,
        velocity: newTweets.length,
        activeTopics: Math.min(
          (prev.activeTopics || 0) +
          new Set(newTweets.map((t) => t.category).filter(Boolean)).size,
          99
        ),
      }));
    } catch (err) {
      console.error('Failed to fetch tweets:', err);
    }
  }, []);

  // Initial fetch + polling when live
  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchTweets, 15000); // poll every 15 s
    return () => clearInterval(interval);
  }, [isLive, fetchTweets]);

  const avgVelocity = velocityData.reduce((s, v) => s + v.count, 0) / (velocityData.length || 1);
  const peakVelocity = Math.max(...velocityData.map((v) => v.count), 0);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center neon-glow-cyan">
                <Radio className="w-6 h-6 text-background" />
              </div>
              {isLive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full pulse-dot" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">X News Crawler</h1>
              <p className="text-sm text-muted-foreground">
                Command Center •{' '}
                <span
                  className={
                    dataSource !== 'mock' ? 'text-neon-green' : 'text-neon-orange'
                  }
                >
                  {dataSource === 'newsapi'
                    ? 'Live • NewsAPI'
                    : dataSource === 'x_api'
                      ? 'Live • X API'
                      : 'Mock Data'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { fetchTweets(); }}
              className="glass-panel px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => setLive(!isLive)}
              className={`glass-panel px-4 py-2 flex items-center gap-2 transition-all ${isLive ? 'neon-glow-green' : 'opacity-60'
                }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${isLive ? 'bg-neon-green pulse-dot' : 'bg-muted'
                  }`}
              />
              <span className="text-sm font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
            </button>
            <button className="glass-panel p-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="mb-6">
        <StatsPanel
          tweetsAnalyzed={stats.tweetsAnalyzed}
          sentimentScore={stats.sentimentScore}
          activeTopics={stats.activeTopics}
          alertsTriggered={stats.alertsTriggered}
          velocity={stats.velocity}
          connectedClients={stats.connected}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            News Velocity
          </h2>
          <VelocityChart
            snapshots={velocityData}
            averageVelocity={avgVelocity}
            peakVelocity={peakVelocity}
          />
        </div>

        {/* Signal Filter */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-orange" />
            Signal / Noise Filter
          </h2>
          <SignalFilter />
        </div>

        {/* Sentiment Map */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-pink" />
            Semantic Sentiment Map
          </h2>
          <SentimentMap tweets={tweets} />
        </div>

        {/* Recent Tweets */}
        <div className="glass-panel p-6 max-h-[400px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-neon-purple" />
            Recent Tweets
            {tweets.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({tweets.length})
              </span>
            )}
          </h2>
          <TweetList tweets={tweets.slice(0, 10)} compact />
        </div>

        {/* Alert Configuration */}
        <div className="lg:col-span-3 glass-panel p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-neon-orange" />
            Alert Configuration
          </h2>
          <AlertConfig />
        </div>
      </div>

      {/* News Ticker */}
      <div className="glass-panel p-4">
        <StaticNewsTicker />
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}
