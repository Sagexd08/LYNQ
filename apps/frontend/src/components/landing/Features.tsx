import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Coins,
  Droplets,
  TrendingUp,
  ArrowLeftRight,
  Repeat
} from 'lucide-react';


interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  size?: 'icon' | 'default';
  className?: string;
}

function Button({ children, onClick, size = 'default', className = '' }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizes: Record<string, string> = {
    icon: 'w-10 h-10 p-2 rounded-full',
    default: 'px-4 py-2 rounded-md text-sm',
  };

  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}


interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl shadow-md ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export default function FeaturesCarousel() {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: 'Small Loans',
      description:
        'Access instant microloans from $100-$5,000 with competitive rates and flexible terms tailored to your needs',
      gradient: 'from-blue-400 to-cyan-400',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Big Loans',
      description: 'Large-scale lending for major investments and business growth',
      gradient: 'from-purple-400 to-pink-400',
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: 'Faucet',
      description: 'Get started with free tokens to build your reputation',
      gradient: 'from-cyan-400 to-blue-400',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Stake Marketplace',
      description: 'Buy and sell staking positions in a secure marketplace',
      gradient: 'from-green-400 to-teal-400',
    },
    {
      icon: <ArrowLeftRight className="w-8 h-8" />,
      title: 'Bridge',
      description: 'Cross-chain asset transfers with minimal fees',
      gradient: 'from-orange-400 to-red-400',
    },
    {
      icon: <Repeat className="w-8 h-8" />,
      title: 'Swap',
      description: 'Instant token swaps with best-in-class rates',
      gradient: 'from-indigo-400 to-purple-400',
    },
  ];

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  const getFeatureIndex = (offset: number) => {
    return (currentFeature + offset + features.length) % features.length;
  };

  const getCurrentFeature = () => features[currentFeature] || features[0]!;
  const getFeatureAt = (offset: number) => features[getFeatureIndex(offset)] || features[0]!;

  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            What We Offer
          </h2>
        </div>

        <div className="relative">
          {}
          <div className="block lg:hidden">
            <div className="flex flex-col items-center space-y-6">
              <Card className="w-full max-w-sm mx-auto bg-white/15 backdrop-blur-xl border-2 border-cyan-400/50 transition-all duration-500 shadow-2xl shadow-cyan-500/30">
                <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-4">
                  <div
                    className={`p-4 sm:p-6 rounded-full bg-gradient-to-r ${getCurrentFeature().gradient} shadow-xl shadow-cyan-500/40`}
                  >
                    {getCurrentFeature().icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {getCurrentFeature().title}
                  </h3>
                  <p className="text-gray-100 leading-relaxed font-medium text-sm sm:text-base">
                    {getCurrentFeature().description}
                  </p>
                </CardContent>
              </Card>
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={prevFeature}
                  size="icon"
                  className="bg-white/10 backdrop-blur-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                
                <div className="flex space-x-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature ? 'bg-cyan-400 w-6' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  onClick={nextFeature}
                  size="icon"
                  className="bg-white/10 backdrop-blur-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
            </div>
          </div>

          {}
          <div className="hidden lg:flex items-center justify-center space-x-8 mb-8">
            <Button
              onClick={prevFeature}
              size="icon"
              className="bg-white/10 backdrop-blur-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 rounded-full w-12 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex items-center space-x-6 px-8">
              {}
              <Card className="w-64 h-80 bg-white/10 backdrop-blur-xl border border-purple-500/30 transform -rotate-6 transition-all duration-500 hover:rotate-0 shadow-lg shadow-purple-500/20">
                <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-4">
                  <div
                    className={`p-4 rounded-full bg-gradient-to-r ${getFeatureAt(-1).gradient} shadow-lg`}
                  >
                    {getFeatureAt(-1).icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {getFeatureAt(-1).title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {getFeatureAt(-1).description}
                  </p>
                </CardContent>
              </Card>

              {}
              <Card className="w-80 h-96 bg-white/15 backdrop-blur-xl border-2 border-cyan-400/50 transform scale-110 transition-all duration-500 shadow-2xl shadow-cyan-500/30">
                <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center space-y-6">
                  <div
                    className={`p-6 rounded-full bg-gradient-to-r ${getCurrentFeature().gradient} shadow-xl shadow-cyan-500/40`}
                  >
                    {getCurrentFeature().icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {getCurrentFeature().title}
                  </h3>
                  <p className="text-gray-100 leading-relaxed">
                    {getCurrentFeature().description}
                  </p>
                </CardContent>
              </Card>

              {}
              <Card className="w-64 h-80 bg-white/10 backdrop-blur-xl border border-purple-500/30 transform rotate-6 transition-all duration-500 hover:rotate-0 shadow-lg shadow-purple-500/20">
                <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-4">
                  <div
                    className={`p-4 rounded-full bg-gradient-to-r ${getFeatureAt(1).gradient} shadow-lg`}
                  >
                    {getFeatureAt(1).icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {getFeatureAt(1).title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {getFeatureAt(1).description}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={nextFeature}
              size="icon"
              className="bg-white/10 backdrop-blur-sm border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 rounded-full w-12 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:border-cyan-400"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          {}
          <div className="flex justify-center space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentFeature
                    ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
