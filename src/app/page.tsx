'use client';

import { useState, useEffect } from 'react';
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
  generateDemoSentimentData,
} from '@/components/dashboard';
import { useDashboardStore } from '@/lib/store';

export default function Home() {
  const { isLive, setLive } = useDashboardStore();

  // Demo data states
  const [velocityData, setVelocityData] = useState(generateDemoVelocityData(30));
  const [sentimentData, setSentimentData] = useState(generateDemoSentimentData(50));
  const [stats, setStats] = useState({
    tweetsAnalyzed: 12847,
    sentimentScore: 0.35,
    activeTopics: 24,
    alertsTriggered: 7,
    velocity: 42,
    connected: 1,
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Update velocity data
      setVelocityData((prev) => {
        const newSnapshot = {
          id: `snapshot_${Date.now()}`,
          timestamp: new Date(),
          count: 15 + Math.floor(Math.random() * 30),
          sentimentAvg: (Math.random() * 2 - 1) * 0.5,
          topCategories: [],
          topKeywords: [],
        };
        return [...prev.slice(1), newSnapshot];
      });

      // Update stats
      setStats((prev) => ({
        ...prev,
        tweetsAnalyzed: prev.tweetsAnalyzed + Math.floor(Math.random() * 10),
        velocity: 30 + Math.floor(Math.random() * 25),
        sentimentScore: Math.max(-1, Math.min(1, prev.sentimentScore + (Math.random() - 0.5) * 0.1)),
      }));

      // Occasionally add new tweets
      if (Math.random() > 0.7) {
        setSentimentData((prev) => {
          const newTweets = generateDemoSentimentData(3);
          return [...newTweets, ...prev].slice(0, 50);
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const avgVelocity = velocityData.reduce((sum, s) => sum + s.count, 0) / velocityData.length;
  const peakVelocity = Math.max(...velocityData.map((s) => s.count));

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
              <h1 className="text-2xl font-bold tracking-tight">
                X News Crawler
              </h1>
              <p className="text-sm text-muted-foreground">
                Command Center • Real-time Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLive(!isLive)}
              className={`
                glass-panel px-4 py-2 flex items-center gap-2 transition-all
                ${isLive ? 'neon-glow-green' : 'opacity-60'}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-neon-green pulse-dot' : 'bg-muted'}`} />
              <span className="text-sm font-medium">{isLive ? 'LIVE' : 'PAUSED'}</span>
            </button>
            <button className="glass-panel p-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Panel */}
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

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* News Velocity Chart */}
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

        {/* Signal Filter Panel */}
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
          <SentimentMap tweets={sentimentData} />
        </div>

        {/* Recent Tweets */}
        <div className="glass-panel p-6 max-h-[400px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-neon-purple" />
            Recent Tweets
          </h2>
          <TweetList tweets={sentimentData.slice(0, 5)} compact />
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
