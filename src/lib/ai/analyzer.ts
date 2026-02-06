// AI Processing Layer - Gemini 1.5 Flash Integration
// Provides sentiment analysis, categorization, spam detection, and headline generation

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { Tweet, SentimentAnalysis, TweetCategory } from '../db/schema';

// ============================================
// Configuration
// ============================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getModel(): GenerativeModel | null {
    if (!GEMINI_API_KEY) {
        console.warn('⚠️ Gemini API key not configured. AI features disabled.');
        return null;
    }

    if (!genAI) {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }

    if (!model) {
        model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                maxOutputTokens: 1024,
            },
        });
    }

    return model;
}

export function isAIConfigured(): boolean {
    return !!GEMINI_API_KEY;
}

// ============================================
// Sentiment Analysis
// ============================================

export interface SentimentResult {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keywords: string[];
}

const SENTIMENT_PROMPT = `Analyze the sentiment of the following tweet. Respond with ONLY a JSON object in this exact format:
{
  "score": <number from -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive>,
  "label": "<positive|negative|neutral>",
  "confidence": <number from 0 to 1>,
  "keywords": [<array of 1-5 key terms that influenced the sentiment>]
}

Tweet: "{text}"`;

export async function analyzeSentiment(text: string): Promise<SentimentResult | null> {
    const model = getModel();
    if (!model) return null;

    try {
        const prompt = SENTIMENT_PROMPT.replace('{text}', text.replace(/"/g, '\\"'));
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Failed to parse sentiment response:', response);
            return null;
        }

        return JSON.parse(jsonMatch[0]) as SentimentResult;
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        return null;
    }
}

// ============================================
// Tweet Categorization
// ============================================

export interface CategoryResult {
    category: TweetCategory;
    confidence: number;
    reasoning: string;
}

const CATEGORY_PROMPT = `Categorize the following tweet into one of these categories:
- breaking_news: Confirmed breaking news from reliable sources
- rumor: Unverified information or speculation
- opinion: Personal opinions, hot takes, commentary
- analysis: In-depth analysis or research
- official: Official statements from organizations/companies
- spam: Promotional content, bots, or irrelevant posts

Respond with ONLY a JSON object in this exact format:
{
  "category": "<category_name>",
  "confidence": <number from 0 to 1>,
  "reasoning": "<brief explanation>"
}

Tweet from @{username} (followers: {followers}, verified: {verified}):
"{text}"`;

export async function categorizeTweet(tweet: Pick<Tweet, 'text' | 'author'>): Promise<CategoryResult | null> {
    const model = getModel();
    if (!model) return null;

    try {
        const prompt = CATEGORY_PROMPT
            .replace('{username}', tweet.author.username)
            .replace('{followers}', tweet.author.followerCount.toString())
            .replace('{verified}', tweet.author.verified.toString())
            .replace('{text}', tweet.text.replace(/"/g, '\\"'));

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Failed to parse category response:', response);
            return null;
        }

        return JSON.parse(jsonMatch[0]) as CategoryResult;
    } catch (error) {
        console.error('Categorization error:', error);
        return null;
    }
}

// ============================================
// Spam/Bot Detection
// ============================================

export interface SpamResult {
    isSpam: boolean;
    spamScore: number;
    indicators: string[];
}

const SPAM_PROMPT = `Analyze if this tweet is spam or from a bot. Consider:
- Promotional language or excessive hashtags
- Low follower count with high activity patterns
- Generic/template-like content
- Suspicious links or mentions

Respond with ONLY a JSON object in this exact format:
{
  "isSpam": <true|false>,
  "spamScore": <number from 0 to 1, where 1 is definitely spam>,
  "indicators": [<array of detected spam indicators, empty if none>]
}

Tweet from @{username} (followers: {followers}):
"{text}"`;

export async function detectSpam(tweet: Pick<Tweet, 'text' | 'author'>): Promise<SpamResult | null> {
    const model = getModel();
    if (!model) return null;

    try {
        const prompt = SPAM_PROMPT
            .replace('{username}', tweet.author.username)
            .replace('{followers}', tweet.author.followerCount.toString())
            .replace('{text}', tweet.text.replace(/"/g, '\\"'));

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]) as SpamResult;
    } catch (error) {
        console.error('Spam detection error:', error);
        return null;
    }
}

// ============================================
// Headline Generation
// ============================================

export interface HeadlineResult {
    headline: string;
    summary: string;
}

const HEADLINE_PROMPT = `Generate a news headline and brief summary from these related tweets about the same topic.
The headline should be concise (max 100 characters) and capture the main story.
The summary should be 1-2 sentences explaining the key details.

Respond with ONLY a JSON object:
{
  "headline": "<concise headline>",
  "summary": "<brief summary>"
}

Tweets:
{tweets}`;

export async function generateHeadline(tweets: Tweet[]): Promise<HeadlineResult | null> {
    const model = getModel();
    if (!model || tweets.length === 0) return null;

    try {
        const tweetsText = tweets
            .slice(0, 10)
            .map((t) => `- @${t.author.username}: "${t.text}"`)
            .join('\n');

        const prompt = HEADLINE_PROMPT.replace('{tweets}', tweetsText);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]) as HeadlineResult;
    } catch (error) {
        console.error('Headline generation error:', error);
        return null;
    }
}

// ============================================
// Full Tweet Analysis Pipeline
// ============================================

export interface FullAnalysisResult {
    sentiment: SentimentResult | null;
    category: CategoryResult | null;
    spam: SpamResult | null;
}

export async function analyzeTweet(tweet: Tweet): Promise<FullAnalysisResult> {
    // Run all analyses in parallel
    const [sentiment, category, spam] = await Promise.all([
        analyzeSentiment(tweet.text),
        categorizeTweet(tweet),
        detectSpam(tweet),
    ]);

    return { sentiment, category, spam };
}

// Enriches a tweet with AI analysis
export async function enrichTweet(tweet: Tweet): Promise<Tweet> {
    const analysis = await analyzeTweet(tweet);

    return {
        ...tweet,
        sentiment: analysis.sentiment ? {
            score: analysis.sentiment.score,
            label: analysis.sentiment.label,
            confidence: analysis.sentiment.confidence,
            keywords: analysis.sentiment.keywords,
            analyzedAt: new Date(),
        } : tweet.sentiment,
        category: analysis.category?.category || tweet.category,
        spamScore: analysis.spam?.spamScore ?? tweet.spamScore,
        isFiltered: analysis.spam?.isSpam ?? tweet.isFiltered,
    };
}

// Batch analysis with rate limiting
export async function analyzeTweetBatch(
    tweets: Tweet[],
    options: { delayMs?: number; onProgress?: (completed: number, total: number) => void } = {}
): Promise<Tweet[]> {
    const { delayMs = 100, onProgress } = options;
    const results: Tweet[] = [];

    for (let i = 0; i < tweets.length; i++) {
        const enriched = await enrichTweet(tweets[i]);
        results.push(enriched);
        onProgress?.(i + 1, tweets.length);

        // Rate limiting delay
        if (i < tweets.length - 1 && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
