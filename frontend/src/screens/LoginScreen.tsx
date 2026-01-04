import { useState } from 'react';
import { api } from '../api';
import type { User } from '../types';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
    const [loading, setLoading] = useState(false);
    const [existingId, setExistingId] = useState('');
    const [error, setError] = useState('');

    const handleCreateUser = async () => {
        setLoading(true);
        setError('');
        try {
            const randomPhone = `+1${Math.floor(Math.random() * 10000000000)}`;
            const user = await api.createUser(randomPhone);
            onLogin(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginById = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!existingId) return;
        setLoading(true);
        setError('');
        try {
            const user = await api.getUser(existingId);
            onLogin(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold font-mono text-emerald-400">FLYN v0</h2>
                <p className="text-neutral-400">Human Validation Interface</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
                <button
                    onClick={handleCreateUser}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Start New Session'}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-neutral-900 px-2 text-neutral-500">Or continue</span>
                    </div>
                </div>

                <form onSubmit={handleLoginById} className="space-y-2">
                    <input
                        type="text"
                        placeholder="Enter User ID"
                        value={existingId}
                        onChange={(e) => setExistingId(e.target.value)}
                        className="w-full py-2 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !existingId}
                        className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-colors disabled:opacity-50 border border-neutral-700"
                    >
                        {loading ? 'Loading...' : 'Resume Session'}
                    </button>
                </form>

                {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                )}
            </div>

            <div className="text-xs text-neutral-600 max-w-xs text-center">
                <p>Simulation only. No real money involved.</p>
                <p>Behavioral data will be recorded.</p>
            </div>
        </div>
    );
};
