import { FaXTwitter, FaGithub, FaDiscord } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-12 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Left - Logo & Tagline */}
        <div className="text-center md:text-left">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            LYNQ
          </h3>
          <p className="mt-2 text-sm text-white/70">Borrow. Build. Belong. DeFi on Aptos.</p>
        </div>

        {/* Right - Links + Socials */}
        <div className="flex flex-col md:items-end gap-3 sm:gap-4">
          {/* Nav Links */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-sm text-white/80">
            <a href="#features" className="hover:text-accent transition">Features</a>
            <a href="#reputation" className="hover:text-accent transition">Reputation</a>
            <a href="#faucet" className="hover:text-accent transition">Faucet</a>
            <a href="#built-on-aptos" className="hover:text-accent transition">Built on Aptos</a>
            <a href="#faq" className="hover:text-accent transition">FAQ</a>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 sm:gap-5 mt-2 text-lg sm:text-xl text-white/70">
            <a
              href="https://twitter.com/yourproject" target="_blank" rel="noopener noreferrer"
              className="hover:text-accent transition"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://github.com/yourproject" target="_blank" rel="noopener noreferrer"
              className="hover:text-accent transition"
            >
              <FaGithub />
            </a>
            <a
              href="https://discord.gg/yourproject" target="_blank" rel="noopener noreferrer"
              className="hover:text-accent transition"
            >
              <FaDiscord />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="mt-8 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} [NAME]. All rights reserved.
      </div>
    </footer>
  );
}
