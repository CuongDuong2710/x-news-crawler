'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Volume2, VolumeX, X } from 'lucide-react';
import { useAlertStore } from '@/lib/store';
import type { SpikeAlertPayload } from '@/lib/realtime/socket-server';

interface NotificationToastProps {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    onDismiss: (id: string) => void;
}

function NotificationToast({ id, message, type, onDismiss }: NotificationToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(id), 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [id, onDismiss]);

    const colors = {
        info: 'border-neon-cyan bg-neon-cyan/10',
        warning: 'border-neon-orange bg-neon-orange/10',
        error: 'border-neon-pink bg-neon-pink/10',
    };

    const icons = {
        info: <TrendingUp className="w-5 h-5 text-neon-cyan" />,
        warning: <AlertTriangle className="w-5 h-5 text-neon-orange" />,
        error: <AlertTriangle className="w-5 h-5 text-neon-pink" />,
    };

    return (
        <div
            className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-lg transition-all duration-300
        ${colors[type]}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
        >
            {icons[type]}
            <p className="flex-1 text-sm">{message}</p>
            <button
                onClick={() => onDismiss(id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function NotificationCenter() {
    const { activeNotifications, removeNotification } = useAlertStore();
    const [isMuted, setIsMuted] = useState(false);

    // Play sound on new notification (if not muted)
    useEffect(() => {
        if (activeNotifications.length > 0 && !isMuted) {
            // Would play notification sound here
            console.log('🔔 New notification');
        }
    }, [activeNotifications.length, isMuted]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
            {/* Mute Toggle */}
            {activeNotifications.length > 0 && (
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="self-end p-2 glass-panel hover:bg-secondary/50 transition-colors"
                >
                    {isMuted ? (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <Volume2 className="w-4 h-4 text-neon-cyan" />
                    )}
                </button>
            )}

            {/* Notifications */}
            {activeNotifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    {...notification}
                    onDismiss={removeNotification}
                />
            ))}
        </div>
    );
}

// ============================================
// Spike Alert Banner
// ============================================

interface SpikeAlertBannerProps {
    alert: SpikeAlertPayload | null;
    onDismiss: () => void;
}

export function SpikeAlertBanner({ alert, onDismiss }: SpikeAlertBannerProps) {
    if (!alert) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-neon-pink/20 via-neon-orange/20 to-neon-pink/20 border-b border-neon-pink/50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-neon-pink animate-pulse" />
                        <span className="font-bold text-neon-pink">SPIKE DETECTED</span>
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">{alert.topic}</span>
                        <span className="text-muted-foreground mx-2">•</span>
                        <span>{alert.tweetCount} tweets in burst</span>
                        <span className="text-muted-foreground mx-2">•</span>
                        <span className={
                            alert.sentiment === 'positive' ? 'text-neon-green' :
                                alert.sentiment === 'negative' ? 'text-neon-pink' :
                                    'text-neon-cyan'
                        }>
                            {alert.sentiment} sentiment
                        </span>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ============================================
// Alert History Panel
// ============================================

interface AlertHistoryProps {
    alerts: SpikeAlertPayload[];
    maxItems?: number;
}

export function AlertHistory({ alerts, maxItems = 10 }: AlertHistoryProps) {
    if (alerts.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No alerts yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {alerts.slice(0, maxItems).map((alert, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                    <AlertTriangle className="w-4 h-4 text-neon-orange flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.topic}</p>
                        <p className="text-xs text-muted-foreground">
                            {alert.tweetCount} tweets • {alert.sentiment}
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {new Date(alert.startTime).toLocaleTimeString()}
                    </span>
                </div>
            ))}
        </div>
    );
}
