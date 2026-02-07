# X News Crawler Dashboard

A real-time news intelligence dashboard for monitoring X/Twitter content with AI-powered analysis.

![Dashboard Preview](docs/preview.png)

## ✨ Features

- **📊 News Velocity Chart** - Real-time tweet volume visualization with spike detection
- **🎯 Semantic Sentiment Map** - Scatter plot showing sentiment distribution over time
- **🔍 Signal vs Noise Filter** - Filter spam, bots, and low-influence content
- **📰 Auto-Generated News Ticker** - AI-powered headline generation
- **🚨 Agentic Alert System** - Configurable alerts with Discord webhook integration
- **🤖 AI Processing** - Gemini 1.5 Flash for sentiment, categorization, spam detection

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- (Optional) X API v2 credentials
- (Optional) Gemini API key
- (Optional) Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/x-news-crawler.git
cd x-news-crawler

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# X API (optional - uses mock data if not provided)
X_BEARER_TOKEN=your_twitter_bearer_token

# Gemini AI (optional - AI features disabled if not provided)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (optional - uses local state if not provided)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Architecture

```
src/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Main dashboard
│   ├── layout.tsx       # Root layout with dark theme
│   └── globals.css      # Tailwind + custom styles
├── components/
│   └── dashboard/       # Dashboard components
│       ├── VelocityChart.tsx
│       ├── SentimentMap.tsx
│       ├── SignalFilter.tsx
│       ├── NewsTicker.tsx
│       ├── TweetCard.tsx
│       ├── StatsPanel.tsx
│       ├── AlertConfig.tsx
│       └── NotificationCenter.tsx
└── lib/
    ├── db/              # Database schema & client
    ├── store/           # Zustand state management
    ├── mock/            # Mock data generators
    ├── api/             # X API integration
    ├── ai/              # Gemini AI analyzer
    ├── alerts/          # Alert engine
    └── realtime/        # Socket.io infrastructure
```

## 🎨 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15+ (App Router) |
| Styling | Tailwind CSS v4 + Shadcn/UI |
| Charts | Recharts |
| State | Zustand |
| Real-time | Socket.io |
| AI | Gemini 1.5 Flash |
| Database | Supabase (PostgreSQL) |

## 📊 Components

### VelocityChart
Real-time area chart showing tweet volume over time with:
- Average and peak velocity indicators
- Spike threshold line (300%+ of average)
- Gradient fill with neon styling

### SentimentMap
Scatter plot visualization:
- X-axis: Time (0-60 minutes ago)
- Y-axis: Sentiment score (-1 to +1)
- Point size: Influence (follower count)
- Color: Positive (green), Neutral (cyan), Negative (pink)

### SignalFilter
Content filtering controls:
- Show/hide spam and bot content
- Minimum follower threshold
- Category filters (Breaking, Rumor, Opinion, Analysis, Official)

### AlertConfig
Alert management system:
- Create alerts with multiple conditions
- Velocity spike, sentiment shift, keyword match, category match
- Discord webhook integration
- In-app notifications

## 🔔 Alert System

Configure alerts that trigger on:
- **Velocity Spike**: Tweet volume increases 300%+
- **Sentiment Shift**: Average sentiment exceeds threshold
- **Keyword Match**: Specific keywords detected
- **Category Match**: Breaking news or rumor categories

Notifications are sent to:
- In-app notification center
- Discord webhook (optional)

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t x-news-crawler .

# Run container
docker run -p 3000:3000 x-news-crawler
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
