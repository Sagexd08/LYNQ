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

// Inline CheckCircle Icon (Lucide style)
function CheckCircle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2l4 -4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default function Reputation() {
  return (
    <section className="py-12 sm:py-16 md:py-20 relative" id="reputation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Reputation System Highlight
          </h2>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Side */}
          <div className="space-y-6 sm:space-y-8">
            <Card className="bg-white/10 backdrop-blur-xl border border-green-400/30 p-6 sm:p-8 shadow-lg shadow-green-500/20">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-semibold text-white">Reputation Score</span>
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">850</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2 sm:h-3 backdrop-blur-sm border border-gray-600/30">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 sm:h-3 rounded-full w-[85%] shadow-lg shadow-green-400/30"></div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-cyan-400">12</div>
                    <div className="text-xs sm:text-sm text-gray-400">Loans Repaid</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">100%</div>
                    <div className="text-sm text-gray-400">On-Time Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-400">$50K</div>
                    <div className="text-sm text-gray-400">Credit Limit</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Checklist */}
            <div className="space-y-4">
              {[
                "On-chain repayment history builds reputation",
                "Higher scores unlock larger loan amounts",
                "Transparent, immutable credit scoring"
              ].map((text, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-gray-200">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side – Steps */}
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-white">How It Works</h3>
              <div className="space-y-6">
                {[
                  { step: 1, title: "Start Building", desc: "Get your first loan with collateral" },
                  { step: 2, title: "Repay On-Time", desc: "Build reputation with each payment" },
                  { step: 3, title: "Unlock Access", desc: "Access larger loans and better terms" },
                  { step: 4, title: "Elite Status", desc: "Become a trusted community member" }
                ].map((item) => (
                  <div key={item.step} className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center justify-center font-bold text-black">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-sm text-gray-300">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Earn Reputation, Unlock Access
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
