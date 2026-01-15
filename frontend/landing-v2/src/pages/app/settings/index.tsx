import { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { Panel, Card } from '@/components/ui/Section';
import { useAuth } from '@/hooks/useAuth';
import {
    User,
    Bell,
    Shield,
    Wallet,
    Globe,
    Moon,
    Sun,
    Copy,
    CheckCircle,
} from 'lucide-react';

type Tab = 'profile' | 'notifications' | 'security' | 'connections';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'connections', label: 'Connections', icon: Wallet },
    ] as const;

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-48 flex-shrink-0">
                        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === tab.id
                                            ? 'bg-primary-500/10 text-primary-400 shadow-sm border border-primary-500/20'
                                            : 'text-gray-500 hover:text-gray-200 hover:bg-surface-100/50 border border-transparent'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-6">
                        {activeTab === 'profile' && <ProfileTab />}
                        {activeTab === 'notifications' && <NotificationsTab />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'connections' && <ConnectionsTab />}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

function ProfileTab() {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const { profile } = useAuth();

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <Panel title="Profile Information">
                <div className="space-y-4">
                    <SettingRow
                        label="Wallet Address"
                        value={profile?.walletAddress || 'Not connected'}
                        action={profile?.walletAddress ? <CopyButton text={profile.walletAddress} /> : null}
                    />
                    <SettingRow
                        label="Account Created"
                        value={formatDate(profile?.createdAt)}
                    />
                    <SettingRow label="Email" value="Not connected" action={
                        <button className="text-xs text-cyan-400 hover:underline">Connect</button>
                    } />
                    <SettingRow label="Telegram" value="Not connected" action={
                        <button className="text-xs text-cyan-400 hover:underline">Connect</button>
                    } />
                </div>
            </Panel>

            <Panel title="Preferences">
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <span className="text-sm text-gray-300">Theme</span>
                            <p className="text-xs text-gray-600">Choose your interface theme</p>
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-[#111114] border border-[#1f1f25] rounded">
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${theme === 'dark' ? 'bg-[#1a1a1f] text-gray-200' : 'text-gray-500'
                                    }`}
                            >
                                <Moon className="w-4 h-4" />
                                Dark
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${theme === 'light' ? 'bg-[#1a1a1f] text-gray-200' : 'text-gray-500'
                                    }`}
                            >
                                <Sun className="w-4 h-4" />
                                Light
                            </button>
                        </div>
                    </div>

                    <SettingRow label="Default Currency" value="USD" action={
                        <select className="bg-[#111114] border border-[#1f1f25] rounded px-3 py-1 text-sm text-gray-300">
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                            <option>ETH</option>
                        </select>
                    } />

                    <SettingRow label="Timezone" value="UTC+0" action={
                        <select className="bg-[#111114] border border-[#1f1f25] rounded px-3 py-1 text-sm text-gray-300">
                            <option>UTC+0</option>
                            <option>UTC+5:30</option>
                            <option>UTC-5</option>
                            <option>UTC+8</option>
                        </select>
                    } />
                </div>
            </Panel>
        </div>
    );
}

function NotificationsTab() {
    return (
        <div className="space-y-6">
            <Panel title="Email Notifications">
                <div className="space-y-3">
                    <ToggleSetting
                        label="Loan Updates"
                        description="Receive updates when loan status changes"
                        defaultChecked={true}
                    />
                    <ToggleSetting
                        label="Risk Alerts"
                        description="Get notified when your risk level changes"
                        defaultChecked={true}
                    />
                    <ToggleSetting
                        label="Payment Reminders"
                        description="Receive reminders before payment due dates"
                        defaultChecked={true}
                    />
                    <ToggleSetting
                        label="Market Updates"
                        description="Weekly market and protocol updates"
                        defaultChecked={false}
                    />
                </div>
            </Panel>

            <Panel title="Push Notifications">
                <div className="space-y-3">
                    <ToggleSetting
                        label="Browser Notifications"
                        description="Receive push notifications in browser"
                        defaultChecked={false}
                    />
                    <ToggleSetting
                        label="Telegram Notifications"
                        description="Receive alerts via Telegram bot"
                        defaultChecked={true}
                    />
                </div>
            </Panel>

            <Panel title="Alert Thresholds">
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <span className="text-sm text-gray-300">Health Factor Alert</span>
                            <p className="text-xs text-gray-600">Notify when health factor drops below</p>
                        </div>
                        <input
                            type="number"
                            defaultValue="1.5"
                            step="0.1"
                            className="w-20 bg-[#111114] border border-[#1f1f25] rounded px-3 py-1 text-sm text-gray-300 font-mono text-right"
                        />
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <span className="text-sm text-gray-300">Collateral Drop Alert</span>
                            <p className="text-xs text-gray-600">Notify when collateral value drops by %</p>
                        </div>
                        <input
                            type="number"
                            defaultValue="10"
                            className="w-20 bg-[#111114] border border-[#1f1f25] rounded px-3 py-1 text-sm text-gray-300 font-mono text-right"
                        />
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function SecurityTab() {
    return (
        <div className="space-y-6">
            <Panel title="Security Settings">
                <div className="space-y-3">
                    <ToggleSetting
                        label="Two-Factor Authentication"
                        description="Require 2FA for all transactions"
                        defaultChecked={false}
                    />
                    <ToggleSetting
                        label="Transaction Signing"
                        description="Require wallet signature for all actions"
                        defaultChecked={true}
                    />
                    <ToggleSetting
                        label="IP Whitelist"
                        description="Limit access to specific IP addresses"
                        defaultChecked={false}
                    />
                </div>
            </Panel>

            <Panel title="Session Management">
                <div className="space-y-4">
                    <SettingRow label="Current Session" value="Active" action={
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                            <span className="w-2 h-2 bg-green-400 rounded-full" />
                            Active now
                        </span>
                    } />
                    <SettingRow label="Last Login" value="Today at 10:23 AM (UTC)" />
                    <SettingRow label="Login IP" value="192.168.1.***" />
                    <div className="pt-4 border-t border-[#1f1f25]">
                        <button className="text-sm text-red-400 hover:underline">
                            Revoke all sessions
                        </button>
                    </div>
                </div>
            </Panel>

            <Panel title="API Keys">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        API keys allow programmatic access to your account. Keep them secure.
                    </p>
                    <button className="text-sm px-4 py-2 bg-[#111114] border border-[#1f1f25] rounded hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-colors">
                        Generate API Key
                    </button>
                </div>
            </Panel>
        </div>
    );
}

function ConnectionsTab() {
    const { profile } = useAuth();
    const [telegramState, setTelegramState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [pairingCode, setPairingCode] = useState('');

    const startTelegramConnection = () => {
        setTelegramState('connecting');
        // Simulate generating a code
        setPairingCode(`LYNQ-${Math.floor(1000 + Math.random() * 9000)}`);
    };

    const formatAddress = (address?: string) => {
        if (!address) return 'Not connected';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="space-y-6">
            <Panel title="Connected Wallets">
                <div className="space-y-4">
                    {profile?.walletAddress ? (
                        <Card>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center border border-white/5">
                                        <Wallet className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-200 font-medium">Connected Wallet</span>
                                        <p className="text-xs text-gray-500 font-mono">{formatAddress(profile.walletAddress)}</p>
                                    </div>
                                </div>
                                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    Active
                                </span>
                            </div>
                        </Card>
                    ) : (
                        <p className="text-sm text-gray-500">No wallet connected</p>
                    )}
                </div>
                <button className="mt-4 text-sm px-4 py-2 bg-surface-100/50 border border-white/10 rounded-lg hover:border-primary-500/30 text-gray-400 hover:text-primary-400 transition-colors">
                    Connect Another Wallet
                </button>
            </Panel>

            <Panel title="Telegram Integration">
                {telegramState === 'disconnected' && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-[#229ED9]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#229ED9]/20">
                            <Bell className="w-8 h-8 text-[#229ED9]" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-200 mb-2">Connect Telegram Bot</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                            Get instant alerts about your loan health, margin calls, and market updates directly in Telegram.
                        </p>
                        <button
                            onClick={startTelegramConnection}
                            className="bg-[#229ED9] hover:bg-[#1c8bc0] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#229ED9]/20"
                        >
                            Connect Telegram
                        </button>
                    </div>
                )}

                {telegramState === 'connecting' && (
                    <div className="bg-surface-50/50 rounded-xl p-6 border border-white/5">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h4 className="text-base font-medium text-white">Link your account</h4>
                                <ol className="space-y-3 text-sm text-gray-400">
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-xs border border-white/10">1</span>
                                        <span>Open the LYNQ Bot on Telegram</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-xs border border-white/10">2</span>
                                        <span>Click "Start" or type <code className="bg-black/30 px-1 rounded">/start</code></span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center text-xs border border-white/10">3</span>
                                        <span>Send the code below to the bot</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="bg-black/40 p-6 rounded-xl border border-white/10 text-center min-w-[200px]">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Your Pairing Code</span>
                                <div className="text-3xl font-mono font-bold text-primary-400 tracking-wider mb-2">{pairingCode}</div>
                                <p className="text-xs text-gray-600">Expires in 5:00</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setTelegramState('disconnected')}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <a
                                href="https://t.me/Lynq_bot"
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors font-medium"
                            >
                                Open Telegram Bot
                            </a>
                        </div>
                    </div>
                )}

                {telegramState === 'connected' && (
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-emerald-400">Telegram Connected</h4>
                                <p className="text-xs text-emerald-500/70">@username • Active</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTelegramState('disconnected')}
                            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
            </Panel>

            <Panel title="Other Connections">
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center border border-white/5">
                                <Globe className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <span className="text-sm text-gray-200">Discord</span>
                                <p className="text-xs text-gray-500">Connect for community roles</p>
                            </div>
                        </div>
                        <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">Connect</button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center border border-white/5">
                                <Globe className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <span className="text-sm text-gray-200">X (Twitter)</span>
                                <p className="text-xs text-gray-500">Link for social verification</p>
                            </div>
                        </div>
                        <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">Connect</button>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function SettingRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-400">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 font-mono">{value}</span>
                {action}
            </div>
        </div>
    );
}

function ToggleSetting({ label, description, defaultChecked }: { label: string; description: string; defaultChecked: boolean }) {
    const [checked, setChecked] = useState(defaultChecked);

    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <span className="text-sm text-gray-300">{label}</span>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary-500' : 'bg-surface-200'
                    }`}
            >
                <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button onClick={handleCopy} className="p-1 hover:bg-[#1a1a1f] rounded">
            {copied ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
                <Copy className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            )}
        </button>
    );
}
