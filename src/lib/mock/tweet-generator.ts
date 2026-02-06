import type { Tweet, TweetCategory, SentimentAnalysis } from '../db/schema';

// ============================================
// Mock Data Configuration
// ============================================

const MOCK_USERNAMES = [
    { username: 'elonmusk', displayName: 'Elon Musk', verified: true, followers: 180000000 },
    { username: 'BBCBreaking', displayName: 'BBC Breaking News', verified: true, followers: 58000000 },
    { username: 'Reuters', displayName: 'Reuters', verified: true, followers: 25000000 },
    { username: 'WSJ', displayName: 'The Wall Street Journal', verified: true, followers: 22000000 },
    { username: 'CNNBreaking', displayName: 'CNN Breaking News', verified: true, followers: 64000000 },
    { username: 'AP', displayName: 'The Associated Press', verified: true, followers: 18000000 },
    { username: 'nytimes', displayName: 'The New York Times', verified: true, followers: 55000000 },
    { username: 'cryptowhale', displayName: 'Crypto Whale 🐋', verified: false, followers: 450000 },
    { username: 'newsbreaker', displayName: 'News Breaker', verified: false, followers: 120000 },
    { username: 'tech_insider', displayName: 'Tech Insider', verified: false, followers: 890000 },
    { username: 'markets_daily', displayName: 'Markets Daily', verified: false, followers: 230000 },
    { username: 'ai_updates', displayName: 'AI Updates', verified: true, followers: 1200000 },
    { username: 'random_user_123', displayName: 'John Doe', verified: false, followers: 342 },
    { username: 'bot_account_456', displayName: 'News Bot', verified: false, followers: 5 },
];

const BREAKING_NEWS_TEMPLATES = [
    'BREAKING: {topic} - More details to follow',
    '🚨 JUST IN: {topic}',
    'DEVELOPING: {topic} according to sources',
    'ALERT: {topic} - officials confirm',
    'BREAKING NEWS: {topic} | Updates coming',
];

const TOPICS = {
    tech: [
        'Apple announces new AI-powered features for iPhone',
        'Google unveils breakthrough in quantum computing',
        'Tesla reports record quarterly deliveries',
        'Microsoft to acquire major AI startup for $10B',
        'OpenAI releases GPT-5 with unprecedented capabilities',
        'Amazon AWS experiences major outage affecting services',
        'Meta launches new VR headset, stock surges 5%',
        'NVIDIA hits new all-time high on AI chip demand',
    ],
    crypto: [
        'Bitcoin breaks $100,000 for the first time',
        'Ethereum upgrade completed successfully',
        'Major exchange reports security breach',
        'SEC approves new crypto ETF applications',
        'Crypto whale moves $500M in Bitcoin',
        'DeFi protocol loses $50M in exploit',
    ],
    politics: [
        'Congress passes major infrastructure bill',
        'President announces new trade policy',
        'Supreme Court ruling impacts tech companies',
        'International summit reaches historic agreement',
        'Election results trigger market volatility',
    ],
    markets: [
        'S&P 500 reaches new record high',
        'Federal Reserve hints at rate changes',
        'Oil prices surge amid supply concerns',
        'Tech stocks lead market rally',
        'Bond yields rise to multi-year highs',
        'Dollar strengthens against major currencies',
    ],
};

const OPINION_TEMPLATES = [
    'Hot take: {topic}. What do you think?',
    'Unpopular opinion but {topic}',
    'Everyone is sleeping on {topic}',
    'My prediction: {topic} within 6 months',
    'Thread: Why {topic} matters more than you think 🧵',
];

const RUMOR_TEMPLATES = [
    'Hearing rumors that {topic}. Unconfirmed.',
    'Sources say {topic} but not verified yet',
    'Whispers of {topic} in the industry',
    '👀 Word on the street: {topic}',
];

// ============================================
// Generator Functions
// ============================================

function generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateMetrics(author: typeof MOCK_USERNAMES[0]): Tweet['metrics'] {
    const baseMultiplier = Math.log10(author.followers + 1) / 2;
    return {
        likes: Math.floor(Math.random() * 1000 * baseMultiplier),
        retweets: Math.floor(Math.random() * 200 * baseMultiplier),
        replies: Math.floor(Math.random() * 100 * baseMultiplier),
        views: Math.floor(Math.random() * 50000 * baseMultiplier),
    };
}

function generateSentiment(): SentimentAnalysis {
    const score = (Math.random() * 2 - 1); // -1 to 1
    let label: SentimentAnalysis['label'];
    if (score > 0.3) label = 'positive';
    else if (score < -0.3) label = 'negative';
    else label = 'neutral';

    return {
        score,
        label,
        confidence: 0.7 + Math.random() * 0.3,
        keywords: ['market', 'tech', 'breaking', 'update'].slice(0, Math.floor(Math.random() * 4) + 1),
        analyzedAt: new Date(),
    };
}

function generateCategory(): TweetCategory {
    const categories: TweetCategory[] = ['breaking_news', 'rumor', 'opinion', 'analysis', 'official'];
    const weights = [0.3, 0.15, 0.25, 0.2, 0.1];
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < categories.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) return categories[i];
    }

    return 'unknown';
}

function generateTweetText(category: TweetCategory): string {
    const topicKey = pickRandom(Object.keys(TOPICS) as (keyof typeof TOPICS)[]);
    const topic = pickRandom(TOPICS[topicKey]);

    switch (category) {
        case 'breaking_news':
        case 'official':
            return pickRandom(BREAKING_NEWS_TEMPLATES).replace('{topic}', topic);
        case 'rumor':
            return pickRandom(RUMOR_TEMPLATES).replace('{topic}', topic);
        case 'opinion':
        case 'analysis':
            return pickRandom(OPINION_TEMPLATES).replace('{topic}', topic);
        default:
            return topic;
    }
}

// ============================================
// Main Generator
// ============================================

export function generateMockTweet(): Tweet {
    const author = pickRandom(MOCK_USERNAMES);
    const category = generateCategory();
    const spamScore = author.followers < 10 ? 0.8 + Math.random() * 0.2 : Math.random() * 0.3;

    return {
        id: generateId(),
        text: generateTweetText(category),
        author: {
            id: `user_${author.username}`,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: `https://unavatar.io/twitter/${author.username}`,
            verified: author.verified,
            followerCount: author.followers,
        },
        metrics: generateMetrics(author),
        createdAt: new Date(Date.now() - Math.random() * 60000), // Within last minute
        source: 'mock',
        sentiment: generateSentiment(),
        category,
        spamScore,
        isFiltered: false,
    };
}

export function generateMockTweets(count: number): Tweet[] {
    return Array.from({ length: count }, () => generateMockTweet());
}

// Generate a "spike" event with many similar tweets
export function generateSpike(topic: string, count: number = 20): Tweet[] {
    return Array.from({ length: count }, () => {
        const author = pickRandom(MOCK_USERNAMES);
        const variations = [
            `${topic}`,
            `BREAKING: ${topic}`,
            `Just heard about ${topic}`,
            `Everyone talking about ${topic}`,
            `📰 ${topic}`,
        ];

        return {
            id: generateId(),
            text: pickRandom(variations),
            author: {
                id: `user_${author.username}`,
                username: author.username,
                displayName: author.displayName,
                avatarUrl: `https://unavatar.io/twitter/${author.username}`,
                verified: author.verified,
                followerCount: author.followers,
            },
            metrics: generateMetrics(author),
            createdAt: new Date(Date.now() - Math.random() * 10000),
            source: 'mock' as const,
            sentiment: generateSentiment(),
            category: 'breaking_news' as TweetCategory,
            spamScore: 0.1,
            isFiltered: false,
        };
    });
}

// ============================================
// Streaming Simulation
// ============================================

type TweetCallback = (tweet: Tweet) => void;
type SpikeCallback = (tweets: Tweet[], topic: string) => void;

let streamInterval: NodeJS.Timeout | null = null;
let spikeTimeout: NodeJS.Timeout | null = null;

export function startMockStream(
    onTweet: TweetCallback,
    options: {
        intervalMs?: number;
        spikeChance?: number;
        onSpike?: SpikeCallback;
    } = {}
): () => void {
    const { intervalMs = 2000, spikeChance = 0.05, onSpike } = options;

    // Clear any existing stream
    stopMockStream();

    streamInterval = setInterval(() => {
        // Random chance of spike
        if (Math.random() < spikeChance && onSpike) {
            const spikeTopic = pickRandom([
                'Major tech company announces layoffs',
                'Cryptocurrency flash crash detected',
                'Breaking political development',
                'Market circuit breakers triggered',
            ]);
            const spikeTweets = generateSpike(spikeTopic, 15 + Math.floor(Math.random() * 10));
            onSpike(spikeTweets, spikeTopic);

            // Feed spike tweets one by one
            spikeTweets.forEach((tweet, i) => {
                setTimeout(() => onTweet(tweet), i * 100);
            });
        } else {
            // Normal tweet
            onTweet(generateMockTweet());
        }
    }, intervalMs);

    // Return cleanup function
    return stopMockStream;
}

export function stopMockStream(): void {
    if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
    }
    if (spikeTimeout) {
        clearTimeout(spikeTimeout);
        spikeTimeout = null;
    }
}

export function isStreamRunning(): boolean {
    return streamInterval !== null;
}
