import type { ReputationEvent } from '../types';

interface HistoryScreenProps {
    events: ReputationEvent[];
    onBack: () => void;
}

export const HistoryScreen = ({ events, onBack }: HistoryScreenProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="text-neutral-400 hover:text-white">
                    ← Back
                </button>
                <h2 className="text-xl font-medium text-white">Reputation History</h2>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            <div className="space-y-4">
                {events.length === 0 ? (
                    <p className="text-center text-neutral-500 py-8">No history events yet.</p>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="bg-neutral-800 p-4 rounded-lg border border-neutral-700 flex justify-between items-center">
                            <div>
                                <p className="text-white font-medium">{event.reason || event.type}</p>
                                <p className="text-xs text-neutral-500">{new Date(event.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className={`text-lg font-bold ${event.delta > 0 ? 'text-emerald-400' : event.delta < 0 ? 'text-red-400' : 'text-neutral-400'}`}>
                                {event.delta > 0 ? '+' : ''}{event.delta}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
