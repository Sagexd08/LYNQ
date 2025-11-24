'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  const stats = {
    totalUsers: 1247,
    activeLoans: 523,
    totalVolume: '$2.4M',
    defaultRate: '2.3%',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">LYNQ Admin</h1>
            <div className="space-x-4">
              <Link href="/dashboard/users" className="hover:text-purple-400">Users</Link>
              <Link href="/dashboard/loans" className="hover:text-purple-400">Loans</Link>
              <Link href="/dashboard/compliance" className="hover:text-purple-400">Compliance</Link>
              <Link href="/dashboard/fraud" className="hover:text-purple-400">Fraud</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Active Loans</h3>
            <p className="text-3xl font-bold">{stats.activeLoans}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Total Volume</h3>
            <p className="text-3xl font-bold">{stats.totalVolume}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-2">Default Rate</h3>
            <p className="text-3xl font-bold">{stats.defaultRate}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Recent Loans</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <div>
                    <p className="font-semibold">Loan #{1000 + i}</p>
                    <p className="text-sm text-gray-400">$5,000 - Ethereum</p>
                  </div>
                  <span className="px-3 py-1 bg-green-600 rounded text-sm">Active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Fraud Alerts</h3>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <div>
                    <p className="font-semibold">Alert #{2000 + i}</p>
                    <p className="text-sm text-gray-400">Suspicious activity detected</p>
                  </div>
                  <span className="px-3 py-1 bg-red-600 rounded text-sm">High Risk</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
