import { useState } from 'react';

interface CTAandFAQProps {
  onNavigateToApp: () => void;
}

export default function CTAandFAQ({ onNavigateToApp }: CTAandFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'What makes [NAME] different from other DeFi platforms?',
      a: "We use on-chain reputation and stake to power trustless, secure lending on Ethereum. No credit scores, no KYC.",
    },
    {
      q: 'Can I withdraw from the faucet?',
      a: 'No. Faucet funds are for building reputation only and cannot be swapped or withdrawn.',
    },
    {
      q: 'How do I build my reputation?',
      a: 'By borrowing responsibly and repaying on time. Your on-chain behavior determines your creditworthiness.',
    },
    {
      q: 'What chains are supported?',
      a: "We're built entirely on Ethereum to take advantage of its security, decentralization, and established ecosystem.",
    },
  ];

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 sm:gap-12 items-start justify-between relative z-10"
    >
      {}
      <div className="lg:w-1/2 space-y-4 sm:space-y-6 text-center lg:text-left">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Ready to Join the Future of DeFi?
        </h2>
        <p className="text-white/80 max-w-md mx-auto lg:mx-0 text-base sm:text-lg">
          Start your on-chain journey today — reputation-first, beginner-friendly, and built to scale.
        </p>
        <button 
          onClick={onNavigateToApp}
          className="w-full sm:w-auto px-6 py-3 mt-3 sm:mt-4 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 text-white font-semibold hover:shadow-glow transition-all"
        >
          Launch App
        </button>
      </div>

      {}
      <div className="lg:w-1/2 w-full bg-white/5 border border-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-lg hover:drop-shadow-glow transition-all">
        <h3 className="text-2xl font-semibold text-accent mb-6">Frequently Asked Questions</h3>
        <ul className="space-y-5">
          {faqs.map((faq, index) => (
            <li key={index}>
              <button
                onClick={() => toggle(index)}
                className="w-full text-left text-white/90 font-medium focus:outline-none"
              >
                <div className="flex justify-between items-center">
                  <span>{faq.q}</span>
                  <span className="text-accent text-xl">{openIndex === index ? '−' : '+'}</span>
                </div>
              </button>
              {openIndex === index && (
                <p className="mt-2 text-sm text-white/70">{faq.a}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
