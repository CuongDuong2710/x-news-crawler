// Socket.io Real-time Infrastructure
// Server-side socket configuration for Next.js

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Tweet, VelocitySnapshot } from '../db/schema';

// ============================================
// Socket Events
// ============================================

export const SOCKET_EVENTS = {
    // Client -> Server
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room',
    REQUEST_HISTORY: 'request-history',

    // Server -> Client
    NEW_TWEET: 'new-tweet',
    TWEET_BATCH: 'tweet-batch',
    VELOCITY_UPDATE: 'velocity-update',
    SPIKE_ALERT: 'spike-alert',
    CONNECTION_STATUS: 'connection-status',
} as const;

export type SocketEventType = keyof typeof SOCKET_EVENTS;

// ============================================
// Event Payloads
// ============================================

export interface SpikeAlertPayload {
    topic: string;
    tweetCount: number;
    startTime: Date;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export interface ConnectionStatusPayload {
    connected: boolean;
    clientCount: number;
    serverTime: Date;
}

// ============================================
// Socket Server Singleton
// ============================================

let io: SocketIOServer | null = null;
let connectedClients = 0;

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
    if (io) return io;

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : process.env.NEXT_PUBLIC_APP_URL,
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        connectedClients++;
        console.log(`🔌 Client connected: ${socket.id} (Total: ${connectedClients})`);

        // Send connection status
        socket.emit(SOCKET_EVENTS.CONNECTION_STATUS, {
            connected: true,
            clientCount: connectedClients,
            serverTime: new Date(),
        } as ConnectionStatusPayload);

        // Handle room joining (for topic-specific streams)
        socket.on(SOCKET_EVENTS.JOIN_ROOM, (room: string) => {
            socket.join(room);
            console.log(`📺 ${socket.id} joined room: ${room}`);
        });

        socket.on(SOCKET_EVENTS.LEAVE_ROOM, (room: string) => {
            socket.leave(room);
            console.log(`📺 ${socket.id} left room: ${room}`);
        });

        socket.on('disconnect', () => {
            connectedClients--;
            console.log(`🔌 Client disconnected: ${socket.id} (Total: ${connectedClients})`);
        });
    });

    console.log('✅ Socket.io server initialized');
    return io;
}

export function getSocketServer(): SocketIOServer | null {
    return io;
}

// ============================================
// Broadcast Functions
// ============================================

export function broadcastTweet(tweet: Tweet): void {
    if (!io) return;
    io.emit(SOCKET_EVENTS.NEW_TWEET, tweet);
}

export function broadcastTweetBatch(tweets: Tweet[]): void {
    if (!io) return;
    io.emit(SOCKET_EVENTS.TWEET_BATCH, tweets);
}

export function broadcastVelocityUpdate(snapshot: VelocitySnapshot): void {
    if (!io) return;
    io.emit(SOCKET_EVENTS.VELOCITY_UPDATE, snapshot);
}

export function broadcastSpikeAlert(alert: SpikeAlertPayload): void {
    if (!io) return;
    io.emit(SOCKET_EVENTS.SPIKE_ALERT, alert);
}

export function broadcastToRoom(room: string, event: string, data: unknown): void {
    if (!io) return;
    io.to(room).emit(event, data);
}

export function getConnectedClientCount(): number {
    return connectedClients;
}
