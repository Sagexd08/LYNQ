// Inline Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// Inline Button Component
interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Inline Shield Icon (Lucide-style)
function Shield({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5-1 9-5 9-10V5l-9-3-9 3v7c0 5 4 9 9 10z" />
    </svg>
  );
}

export default function FaucetModule() {
  return (
    <section id="faucet" className="py-12 sm:py-16 md:py-20 relative text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-cyan-400/40 p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-cyan-500/20">
          {/* Top Label */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <div className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-black text-xs sm:text-sm font-semibold rounded-full animate-pulse shadow-lg">
              Developer Safe Start
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Developer Faucet Module
              </h2>
              <p className="text-xl text-gray-200">
                New to Web3? Get testnet ETH tokens to start building your reputation on Ethereum blockchain.
              </p>
            </div>

            {/* Warning Card */}
            <div className="bg-black/30 rounded-xl p-6 border border-yellow-500/40 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Anti-Abuse Protection</h3>
                  <p className="text-gray-200">
                    These tokens cannot be swapped or withdrawn. Use them exclusively for building your reputation through responsible lending activities on our platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-xl border border-cyan-400/30 backdrop-blur-sm shadow-lg">
                <div className="text-2xl font-bold text-cyan-400">1000</div>
                <div className="text-sm text-gray-300">APT Tokens</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl border border-purple-400/30 backdrop-blur-sm shadow-lg">
                <div className="text-2xl font-bold text-purple-400">One-Time</div>
                <div className="text-sm text-gray-300">Per Wallet</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl border border-pink-400/30 backdrop-blur-sm shadow-lg">
                <div className="text-2xl font-bold text-pink-400">Reputation Only</div>
                <div className="text-sm text-gray-300">Usage Type</div>
              </div>
            </div>

            {/* CTA Button */}
            <Button className="w-full bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-400 hover:to-blue-400 text-white py-4 text-lg border border-cyan-400/30 backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105">
              Claim Faucet
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
