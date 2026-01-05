import { useState } from 'react';
import { Settings, Bell, Shield, User, Wallet, Moon, Sun, Info } from 'lucide-react';
import { TelegramConnect } from '../components/telegram/TelegramConnect';

interface SettingsPageProps {
    walletAddress?: string;
    userId?: string;
}

export const SettingsPage = ({ walletAddress, userId }: SettingsPageProps) => {
    const [activeTab, setActiveTab] = useState<'notifications' | 'account' | 'security'>('notifications');
    const [isDarkMode, setIsDarkMode] = useState(true);

    const tabs = [
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'account' as const, label: 'Account', icon: User },
        { id: 'security' as const, label: 'Security', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Settings
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Manage your account preferences and notifications
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'notifications' && (
                        <>
                            {/* Telegram Section */}
                            <section>
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-blue-400" />
                                    Telegram Notifications
                                </h2>
                                <TelegramConnect
                                    userId={userId}
                                    walletAddress={walletAddress}
                                    onConnect={(chatId) => {
                                        console.log('Connected with Chat ID:', chatId);
                                    }}
                                    onDisconnect={() => {
                                        console.log('Disconnected from Telegram');
                                    }}
                                />
                            </section>

                            {/* Email Notifications */}
                            <section className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                <h3 className="font-metrics text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-gray-400" />
                                    Email Notifications
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Email notifications are coming soon. Connect your Telegram to receive instant updates.
                                </p>
                            </section>
                        </>
                    )}

                    {activeTab === 'account' && (
                        <>
                            {/* Wallet Info */}
                            <section className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                <h3 className="font-metrics text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-blue-400" />
                                    Connected Wallet
                                </h3>
                                {walletAddress ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {walletAddress.slice(2, 4).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-mono text-white">
                                                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                            </p>
                                            <p className="text-xs text-gray-400">Primary Wallet</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No wallet connected</p>
                                )}
                            </section>

                            {/* Appearance */}
                            <section className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                <h3 className="font-metrics text-sm font-semibold text-white mb-4">
                                    Appearance
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isDarkMode ? (
                                            <Moon className="w-5 h-5 text-blue-400" />
                                        ) : (
                                            <Sun className="w-5 h-5 text-yellow-400" />
                                        )}
                                        <div>
                                            <p className="text-sm text-white">Dark Mode</p>
                                            <p className="text-xs text-gray-400">Use dark theme</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsDarkMode(!isDarkMode)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-gray-600'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : ''
                                                }`}
                                        />
                                    </button>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'security' && (
                        <>
                            {/* Security Info */}
                            <section className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                <h3 className="font-metrics text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-green-400" />
                                    Security Status
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-gray-300">Wallet Connected</span>
                                        <span className={`text-sm ${walletAddress ? 'text-green-400' : 'text-red-400'}`}>
                                            {walletAddress ? '✓ Connected' : '✗ Not Connected'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-gray-300">Two-Factor Auth</span>
                                        <span className="text-sm text-gray-400">Coming Soon</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-300">Session Timeout</span>
                                        <span className="text-sm text-gray-400">24 hours</span>
                                    </div>
                                </div>
                            </section>

                            {/* Connected Sessions */}
                            <section className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                <h3 className="font-metrics text-sm font-semibold text-white mb-4">
                                    Active Sessions
                                </h3>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white">Current Session</p>
                                        <p className="text-xs text-gray-400">Browser • Just now</p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
