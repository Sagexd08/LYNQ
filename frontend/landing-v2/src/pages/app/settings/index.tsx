import { useState, useEffect } from 'react';
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
                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="w-48 flex-shrink-0">
                        <div className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded transition-colors ${activeTab === tab.id
                                            ? 'bg-cyan-500/10 text-cyan-400'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-[#111114]'
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
    const [connectedServices, setConnectedServices] = useState<Array<{
        name: string;
        icon: typeof Bell;
        description: string;
        connected: boolean;
    }>>([]);

    useEffect(() => {
        // TODO: Fetch connected services from API when endpoint is available
        setConnectedServices([
            { name: 'Telegram', icon: Bell, description: 'Receive notifications via Telegram', connected: false },
            { name: 'Discord', icon: Globe, description: 'Connect your Discord account', connected: false },
            { name: 'Twitter', icon: Globe, description: 'Link for social verification', connected: false },
        ]);
    }, []);

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
                                    <div className="w-10 h-10 bg-[#1a1a1f] rounded-full flex items-center justify-center">
                                        <Wallet className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-200">Connected Wallet</span>
                                        <p className="text-xs text-gray-500 font-mono">{formatAddress(profile.walletAddress)}</p>
                                    </div>
                                </div>
                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                                    Primary
                                </span>
                            </div>
                        </Card>
                    ) : (
                        <p className="text-sm text-gray-500">No wallet connected</p>
                    )}
                </div>
                <button className="mt-4 text-sm px-4 py-2 bg-[#111114] border border-[#1f1f25] rounded hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 transition-colors">
                    Connect Another Wallet
                </button>
            </Panel>

            <Panel title="Connected Services">
                <div className="space-y-4">
                    {connectedServices.length > 0 ? (
                        connectedServices.map((service) => (
                            <div key={service.name} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${service.connected ? 'bg-cyan-500/10' : 'bg-[#1a1a1f]'
                                        }`}>
                                        <service.icon className={`w-5 h-5 ${service.connected ? 'text-cyan-400' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-200">{service.name}</span>
                                        <p className="text-xs text-gray-500">{service.description}</p>
                                    </div>
                                </div>
                                {service.connected ? (
                                    <button className="text-xs text-red-400 hover:underline">Disconnect</button>
                                ) : (
                                    <button className="text-xs text-cyan-400 hover:underline">Connect</button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No services available</p>
                    )}
                </div>
            </Panel>
        </div>
    );
}

// Helper Components
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
                <p className="text-xs text-gray-600">{description}</p>
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-[#1a1a1f]'
                    }`}
            >
                <span
                    className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'
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
