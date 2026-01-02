import { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';

interface TelegramConnectProps {
  userId?: string;
  walletAddress?: string;
  onConnect?: (chatId: string) => void;
}

export const TelegramConnect = ({ userId, walletAddress, onConnect }: TelegramConnectProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [chatId, setChatId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'LYNQBot';
  const telegramBotLink = `https://t.me/${botUsername}`;

  const handleConnect = async () => {
    if (!chatId.trim()) {
      alert('Please enter your Telegram Chat ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/telegram/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId,
          chatId: chatId.trim(),
          walletAddress,
        }),
      });

      if (response.ok) {
        setIsConnected(true);
        onConnect?.(chatId);
        alert('✅ Telegram notifications enabled!');
      } else {
        const error = await response.json();
        alert(`Failed to connect: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      alert('Failed to connect to Telegram. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              Get real-time updates on your loans
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
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    @{botUsername}
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
            disabled={isLoading || !chatId.trim()}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
          >
            {isLoading ? 'Connecting...' : 'Connect Telegram'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-green-400">
              ✓ You'll receive notifications for:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-gray-300 list-disc list-inside">
              <li>Loan creation and approval</li>
              <li>Repayment confirmations</li>
              <li>Liquidation warnings</li>
              <li>Credit score updates</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setIsConnected(false);
              setChatId('');
            }}
            className="w-full px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Disconnect
          </button>
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
