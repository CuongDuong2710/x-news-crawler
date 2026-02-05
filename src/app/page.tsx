import { Activity, Radio, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center neon-glow-cyan">
                <Radio className="w-6 h-6 text-background" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full pulse-dot" />
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
            <div className="glass-panel px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-green rounded-full pulse-dot" />
              <span className="text-sm font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Tweets Analyzed"
          value="12,847"
          change="+23.5%"
          icon={Activity}
          color="cyan"
        />
        <StatsCard
          title="Sentiment Score"
          value="67.2"
          change="+5.2%"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Active Topics"
          value="24"
          change="+3"
          icon={Zap}
          color="orange"
        />
        <StatsCard
          title="Alerts Triggered"
          value="7"
          change="+2"
          icon={Radio}
          color="pink"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Velocity Chart Placeholder */}
        <div className="lg:col-span-2 glass-panel p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-cyan" />
            News Velocity
          </h2>
          <div className="h-[320px] flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Velocity Chart Coming in Phase 5</p>
          </div>
        </div>

        {/* Signal Filter Panel Placeholder */}
        <div className="glass-panel p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-orange" />
            Signal / Noise Filter
          </h2>
          <div className="h-[320px] flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Filter Controls Coming in Phase 5</p>
          </div>
        </div>

        {/* Sentiment Map Placeholder */}
        <div className="lg:col-span-2 glass-panel p-6 min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-neon-pink" />
            Semantic Sentiment Map
          </h2>
          <div className="h-[270px] flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Sentiment Scatter Plot Coming in Phase 5</p>
          </div>
        </div>

        {/* Alert Config Placeholder */}
        <div className="glass-panel p-6 min-h-[350px]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-neon-purple" />
            Alert Configuration
          </h2>
          <div className="h-[270px] flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">Alerts Coming in Phase 6</p>
          </div>
        </div>
      </div>

      {/* News Ticker Placeholder */}
      <div className="mt-6 glass-panel p-4 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded font-semibold text-sm">
            BREAKING
          </div>
          <div className="overflow-hidden">
            <p className="text-muted-foreground whitespace-nowrap">
              News Ticker Coming in Phase 5 • Auto-generated headlines from AI analysis • Real-time updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'green' | 'orange' | 'pink';
}) {
  const colorClasses = {
    cyan: 'text-neon-cyan',
    green: 'text-neon-green',
    orange: 'text-neon-orange',
    pink: 'text-neon-pink',
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className={`text-sm font-medium ${colorClasses[color]}`}>{change}</span>
      </div>
    </div>
  );
}
