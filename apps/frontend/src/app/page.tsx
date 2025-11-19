import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">LYNQ</h1>
          <Link 
            href="/dashboard" 
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-bold mb-6">
            Multi-Chain DeFi Lending
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Borrow and lend across EVM, Aptos, and Flow with crypto collateral. 
            Build your on-chain reputation and access better rates.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">Multi-Chain</h3>
              <p className="text-gray-300">
                Access loans on Ethereum, Polygon, Aptos, and Flow
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">Reputation System</h3>
              <p className="text-gray-300">
                Build credit score on-chain, unlock better interest rates
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
              <h3 className="text-2xl font-bold mb-3">Learn & Earn</h3>
              <p className="text-gray-300">
                Complete quests, improve your DeFi knowledge
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
