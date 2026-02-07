'use client';

import { useState } from 'react';
import {
    Bell,
    Plus,
    X,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Zap,
    TrendingUp,
    Hash,
    Tag,
    AlertTriangle,
} from 'lucide-react';
import { useAlertStore } from '@/lib/store';
import type { Alert, AlertCondition, AlertAction, TweetCategory } from '@/lib/db/schema';

// ============================================
// Alert List Component
// ============================================

export function AlertConfig() {
    const { alerts, addAlert, removeAlert, toggleAlert } = useAlertStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateAlert = (alert: Alert) => {
        addAlert(alert);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                    Active Alerts ({alerts.length})
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/50 rounded-lg text-xs font-medium text-neon-cyan transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Alert
                </button>
            </div>

            {/* Alert List */}
            <div className="space-y-2">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No alerts configured</p>
                        <p className="text-xs">Create an alert to get notified of important events</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onToggle={() => toggleAlert(alert.id)}
                            onDelete={() => removeAlert(alert.id)}
                        />
                    ))
                )}
            </div>

            {/* Create Alert Modal */}
            {isModalOpen && (
                <CreateAlertModal
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateAlert}
                />
            )}
        </div>
    );
}

// ============================================
// Alert Card Component
// ============================================

interface AlertCardProps {
    alert: Alert;
    onToggle: () => void;
    onDelete: () => void;
}

function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
    const getConditionIcon = (type: AlertCondition['type']) => {
        switch (type) {
            case 'velocity_spike': return <Zap className="w-3.5 h-3.5" />;
            case 'sentiment_shift': return <TrendingUp className="w-3.5 h-3.5" />;
            case 'keyword_match': return <Hash className="w-3.5 h-3.5" />;
            case 'category_match': return <Tag className="w-3.5 h-3.5" />;
            default: return <AlertTriangle className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div
            className={`
        glass-panel p-3 transition-all
        ${alert.enabled ? '' : 'opacity-50'}
      `}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{alert.name}</span>
                        {alert.triggerCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-neon-orange/20 text-neon-orange text-xs rounded">
                                {alert.triggerCount}x triggered
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {alert.conditions.map((condition, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/50 rounded text-xs"
                            >
                                {getConditionIcon(condition.type)}
                                {condition.type.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                        {alert.enabled ? (
                            <ToggleRight className="w-5 h-5 text-neon-green" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                        )}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 hover:bg-destructive/20 rounded transition-colors text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Create Alert Modal
// ============================================

interface CreateAlertModalProps {
    onClose: () => void;
    onCreate: (alert: Alert) => void;
}

function CreateAlertModal({ onClose, onCreate }: CreateAlertModalProps) {
    const [name, setName] = useState('');
    const [conditions, setConditions] = useState<AlertCondition[]>([]);
    const [actions, setActions] = useState<AlertAction[]>([]);
    const [webhookUrl, setWebhookUrl] = useState('');

    const conditionTypes: { type: AlertCondition['type']; label: string; description: string }[] = [
        { type: 'velocity_spike', label: 'Velocity Spike', description: 'Tweet volume increases 300%+' },
        { type: 'sentiment_shift', label: 'Sentiment Shift', description: 'Major positive/negative shift' },
        { type: 'keyword_match', label: 'Keyword Match', description: 'Specific keywords detected' },
        { type: 'category_match', label: 'Category Match', description: 'Breaking news or rumors' },
    ];

    const handleAddCondition = (type: AlertCondition['type']) => {
        if (conditions.find((c) => c.type === type)) return;

        const newCondition: AlertCondition = { type };

        switch (type) {
            case 'velocity_spike':
                newCondition.threshold = 300;
                break;
            case 'sentiment_shift':
                newCondition.threshold = 0.5;
                break;
            case 'keyword_match':
                newCondition.keywords = [];
                break;
            case 'category_match':
                newCondition.categories = ['breaking_news'];
                break;
        }

        setConditions([...conditions, newCondition]);
    };

    const handleRemoveCondition = (type: AlertCondition['type']) => {
        setConditions(conditions.filter((c) => c.type !== type));
    };

    const handleCreate = () => {
        if (!name.trim() || conditions.length === 0) return;

        const alertActions: AlertAction[] = [
            { type: 'in_app_notification' },
        ];

        if (webhookUrl.trim()) {
            alertActions.push({ type: 'discord_webhook', webhookUrl: webhookUrl.trim() });
        }

        const alert: Alert = {
            id: `alert_${Date.now()}`,
            name: name.trim(),
            enabled: true,
            conditions,
            actions: alertActions,
            createdAt: new Date(),
            triggerCount: 0,
        };

        onCreate(alert);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass-panel p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto neon-glow-cyan">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Create New Alert</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Alert Name */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Alert Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Breaking News Spike"
                        className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
                    />
                </div>

                {/* Conditions */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Trigger Conditions
                    </label>
                    <div className="space-y-2">
                        {conditionTypes.map((ct) => {
                            const isSelected = conditions.some((c) => c.type === ct.type);
                            return (
                                <button
                                    key={ct.type}
                                    onClick={() => isSelected ? handleRemoveCondition(ct.type) : handleAddCondition(ct.type)}
                                    className={`
                    w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left
                    ${isSelected
                                            ? 'bg-neon-cyan/20 border-neon-cyan/50'
                                            : 'bg-secondary/30 border-transparent hover:bg-secondary/50'
                                        }
                  `}
                                >
                                    <div>
                                        <span className="text-sm font-medium">{ct.label}</span>
                                        <p className="text-xs text-muted-foreground">{ct.description}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-neon-cyan bg-neon-cyan' : 'border-muted'}`}>
                                        {isSelected && <span className="text-background text-xs">✓</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Discord Webhook */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Discord Webhook (Optional)
                    </label>
                    <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Get notified in Discord when this alert triggers
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || conditions.length === 0}
                        className="px-4 py-2 bg-neon-cyan text-background text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neon-cyan/90 transition-colors"
                    >
                        Create Alert
                    </button>
                </div>
            </div>
        </div>
    );
}
