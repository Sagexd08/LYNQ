import React, { useEffect, useState } from 'react';
import PersonalDetails from './PersonalDetails';
import TrustScoreCard from './TrustScoreCard';
import BalanceOverview from './BalanceOverview';

const ProfileDashboard: React.FC = () => {
  const [trustScore, setTrustScore] = useState<number>(0);
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        
        setTrustScore(75);
        setEthBalance(0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Profile Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PersonalDetails ethBalance={ethBalance} />
          </div>
          
          <div className="space-y-8">
            <TrustScoreCard score={trustScore} />
            <BalanceOverview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
