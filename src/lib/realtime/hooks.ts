'use client';

// React hooks for consuming real-time data via Socket.io

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Tweet, VelocitySnapshot } from '../db/schema';
import { SOCKET_EVENTS, type SpikeAlertPayload, type ConnectionStatusPayload } from './socket-server';

// ============================================
// Socket Connection Hook
// ============================================

let socket: Socket | null = null;

function getSocket(): Socket {
    if (!socket) {
        socket = io({
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });
    }
    return socket;
}

export function useSocketConnection() {
    const [isConnected, setIsConnected] = useState(false);
    const [clientCount, setClientCount] = useState(0);

    useEffect(() => {
        const socket = getSocket();

        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onStatus(status: ConnectionStatusPayload) {
            setClientCount(status.clientCount);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on(SOCKET_EVENTS.CONNECTION_STATUS, onStatus);

        // Check initial state
        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off(SOCKET_EVENTS.CONNECTION_STATUS, onStatus);
        };
    }, []);

    const connect = useCallback(() => {
        const socket = getSocket();
        if (!socket.connected) {
            socket.connect();
        }
    }, []);

    const disconnect = useCallback(() => {
        const socket = getSocket();
        if (socket.connected) {
            socket.disconnect();
        }
    }, []);

    return { isConnected, clientCount, connect, disconnect };
}

// ============================================
// Real-time Tweet Stream Hook
// ============================================

export function useTweetStream(options: {
    onTweet?: (tweet: Tweet) => void;
    onBatch?: (tweets: Tweet[]) => void;
    maxTweets?: number;
} = {}) {
    const { onTweet, onBatch, maxTweets = 100 } = options;
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        const socket = getSocket();

        function handleNewTweet(tweet: Tweet) {
            setTweets((prev) => [tweet, ...prev].slice(0, maxTweets));
            onTweet?.(tweet);
        }

        function handleBatch(batch: Tweet[]) {
            setTweets((prev) => [...batch, ...prev].slice(0, maxTweets));
            onBatch?.(batch);
        }

        socket.on(SOCKET_EVENTS.NEW_TWEET, handleNewTweet);
        socket.on(SOCKET_EVENTS.TWEET_BATCH, handleBatch);

        setIsStreaming(socket.connected);

        return () => {
            socket.off(SOCKET_EVENTS.NEW_TWEET, handleNewTweet);
            socket.off(SOCKET_EVENTS.TWEET_BATCH, handleBatch);
        };
    }, [onTweet, onBatch, maxTweets]);

    const clearTweets = useCallback(() => {
        setTweets([]);
    }, []);

    return { tweets, isStreaming, clearTweets };
}

// ============================================
// Velocity Updates Hook
// ============================================

export function useVelocityStream(options: {
    onUpdate?: (snapshot: VelocitySnapshot) => void;
    historyLength?: number;
} = {}) {
    const { onUpdate, historyLength = 60 } = options;
    const [snapshots, setSnapshots] = useState<VelocitySnapshot[]>([]);
    const [currentVelocity, setCurrentVelocity] = useState(0);

    useEffect(() => {
        const socket = getSocket();

        function handleUpdate(snapshot: VelocitySnapshot) {
            setSnapshots((prev) => [...prev, snapshot].slice(-historyLength));
            setCurrentVelocity(snapshot.count);
            onUpdate?.(snapshot);
        }

        socket.on(SOCKET_EVENTS.VELOCITY_UPDATE, handleUpdate);

        return () => {
            socket.off(SOCKET_EVENTS.VELOCITY_UPDATE, handleUpdate);
        };
    }, [onUpdate, historyLength]);

    return { snapshots, currentVelocity };
}

// ============================================
// Spike Alert Hook
// ============================================

export function useSpikeAlerts(options: {
    onAlert?: (alert: SpikeAlertPayload) => void;
} = {}) {
    const { onAlert } = options;
    const [alerts, setAlerts] = useState<SpikeAlertPayload[]>([]);
    const [latestAlert, setLatestAlert] = useState<SpikeAlertPayload | null>(null);

    useEffect(() => {
        const socket = getSocket();

        function handleAlert(alert: SpikeAlertPayload) {
            setAlerts((prev) => [alert, ...prev].slice(0, 20));
            setLatestAlert(alert);
            onAlert?.(alert);
        }

        socket.on(SOCKET_EVENTS.SPIKE_ALERT, handleAlert);

        return () => {
            socket.off(SOCKET_EVENTS.SPIKE_ALERT, handleAlert);
        };
    }, [onAlert]);

    const clearAlerts = useCallback(() => {
        setAlerts([]);
        setLatestAlert(null);
    }, []);

    return { alerts, latestAlert, clearAlerts };
}

// ============================================
// Room Subscription Hook
// ============================================

export function useRoom(roomName: string) {
    const [isJoined, setIsJoined] = useState(false);

    useEffect(() => {
        const socket = getSocket();

        if (socket.connected) {
            socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomName);
            setIsJoined(true);
        }

        function onConnect() {
            socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomName);
            setIsJoined(true);
        }

        socket.on('connect', onConnect);

        return () => {
            socket.emit(SOCKET_EVENTS.LEAVE_ROOM, roomName);
            socket.off('connect', onConnect);
            setIsJoined(false);
        };
    }, [roomName]);

    return { isJoined };
}
