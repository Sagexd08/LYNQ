import { useState, useEffect } from 'react';
import { Bell, Check, X, Send, Settings, ExternalLink, Loader2 } from 'lucide-react';
import { telegramApi, TelegramPreferences } from '../../services/api/telegramApi';
import toast from 'react-hot-toast';

interface TelegramConnectProps {
  userId?: string;
  walletAddress?: string;
  onConnect?: (chatId: string) => void;
  onDisconnect?: () => void;
}

export const TelegramConnect = ({
  walletAddress,
  onConnect,
  onDisconnect
}: TelegramConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [chatId, setChatId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [botStatus, setBotStatus] = useState<{ enabled: boolean; botUsername?: string }>({ enabled: false });
  const [preferences, setPreferences] = useState<TelegramPreferences>({
    loanAlerts: true,
    healthFactorAlerts: true,
    creditScoreAlerts: true,
    transactionAlerts: true,
    dailySummary: false,
    priceAlerts: false,
    marketingMessages: false,
  });

  const botUsername = telegramApi.getBotUsername();
  const telegramBotLink = telegramApi.getBotLink();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const [status, prefs] = await Promise.all([
        telegramApi.getStatus(),
        telegramApi.getPreferences().catch(() => null),
      ]);

      setBotStatus({
        enabled: status.enabled,
        botUsername: status.bot?.username,
      });

      if (prefs?.registered && prefs.chatId) {
        setIsConnected(true);
        setChatId(prefs.chatId);
        if (prefs.preferences) {
          setPreferences(prefs.preferences);
        }
      }
    } catch (error) {
      console.error('Failed to check Telegram status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnect = async () => {
    if (!chatId.trim()) {
      toast.error('Please enter your Telegram Chat ID');
      return;
    }

    if (!walletAddress) {
      toast.error('Wallet address is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await telegramApi.register({
        chatId: chatId.trim(),
        walletAddress,
      });

      if (response.success) {
        setIsConnected(true);
        onConnect?.(chatId);
        toast.success('Telegram notifications enabled!');
      } else {
        toast.error(response.message || 'Failed to connect');
      }
    } catch (error: any) {
      console.error('Error connecting Telegram:', error);
      toast.error(error.response?.data?.message || 'Failed to connect to Telegram');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await telegramApi.unregister();
      if (response.success) {
        setIsConnected(false);
        setChatId('');
        onDisconnect?.();
        toast.success('Telegram notifications disabled');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof TelegramPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await telegramApi.updatePreferences({ [key]: value });
    } catch (error) {
      setPreferences(preferences);
      toast.error('Failed to update preferences');
    }
  };

  const handleTestNotification = async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      const response = await telegramApi.sendTestNotification({ chatId });
      if (response.success) {
        toast.success('Test notification sent! Check your Telegram.');
      } else {
        toast.error(response.message || 'Failed to send test notification');
      }
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-sm text-gray-400">Checking Telegram status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-metrics text-sm font-semibold text-white">
              Telegram Notifications
            </h3>
            <p className="text-xs text-gray-400">
              {botStatus.enabled
                ? 'Get real-time updates on your loans'
                : 'Bot not configured on server'}
            </p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">Connected</span>
          </div>
        )}
      </div>

      {!botStatus.enabled && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400">
            ⚠️ Telegram bot is not configured on the server. Please contact the administrator.
          </p>
        </div>
      )}

      {!isConnected ? (
        <div className="space-y-4">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all"
          >
            {showInstructions ? 'Hide Instructions' : 'Show Setup Instructions'}
          </button>

          {showInstructions && (
            <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-white/5">
              <p className="text-xs text-gray-300 font-medium">Follow these steps:</p>
              <ol className="space-y-2 text-xs text-gray-400 list-decimal list-inside">
                <li>
                  Open Telegram and search for{' '}
                  <a
                    href={telegramBotLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                  >
                    @{botUsername}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Start a conversation with the bot by clicking "Start"</li>
                <li>Send the command <code className="px-1 py-0.5 bg-gray-700 rounded">/start</code></li>
                <li>The bot will reply with your Chat ID</li>
                <li>Copy the Chat ID and paste it below</li>
              </ol>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Enter your Chat ID (e.g., 123456789)"
              className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading || !chatId.trim() || !botStatus.enabled}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Telegram'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-green-400 font-medium">
                ✓ Connected to @{botUsername}
              </p>
              <span className="text-xs text-gray-500">ID: {chatId}</span>
            </div>
          </div>

          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 border border-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {showPreferences ? 'Hide Preferences' : 'Notification Preferences'}
          </button>

          {showPreferences && (
            <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-white/5">
              <p className="text-xs text-gray-300 font-medium mb-3">Notification Settings:</p>

              {Object.entries({
                loanAlerts: 'Loan Alerts',
                healthFactorAlerts: 'Health Factor Warnings',
                creditScoreAlerts: 'Credit Score Updates',
                transactionAlerts: 'Transaction Confirmations',
                dailySummary: 'Daily Summary',
                priceAlerts: 'Price Alerts',
                marketingMessages: 'Marketing Messages',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={preferences[key as keyof TelegramPreferences]}
                      onChange={(e) => handlePreferenceChange(key as keyof TelegramPreferences, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTestNotification}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Test
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-gray-500 text-center">
          Your Chat ID is never shared and only used for notifications
        </p>
      </div>
    </div>
  );
};

export default TelegramConnect;
