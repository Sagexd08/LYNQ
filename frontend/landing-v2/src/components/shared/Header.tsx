'use client';

import { motion } from 'framer-motion';
import { Wallet, Menu, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
	const { profile, isAuthenticated, connectWallet, disconnect, isConnecting } = useAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const address = profile?.walletAddress || null;
	const isConnected = isAuthenticated;

	return (
		<motion.header
			className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10"
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.6 }}
		>
			<nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
				<a
					href="/"
					className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"
				>
					LYNQ
				</a>

				<div className="hidden md:flex items-center gap-8">
					<a href="/#learn" className="text-gray-400 hover:text-white transition text-sm">
						Learn
					</a>
					<a href="/#features" className="text-gray-400 hover:text-white transition text-sm">
						Features
					</a>
					<a href="/learning" className="text-gray-400 hover:text-white transition text-sm">
						Start Learning
					</a>
					<a href="/app" className="text-gray-400 hover:text-white transition text-sm">
						Launch App
					</a>

					<ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
				</div>

				<button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
					{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
				</button>
			</nav>

			{mobileMenuOpen && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
					className="md:hidden bg-black/95 border-t border-white/10"
				>
					<div className="px-6 py-4 space-y-4">
						<a href="/#learn" className="block text-gray-400 hover:text-white transition">
							Learn
						</a>
						<a href="/#features" className="block text-gray-400 hover:text-white transition">
							Features
						</a>
						<a href="/learning" className="block text-gray-400 hover:text-white transition">
							Start Learning
						</a>
						<a href="/app" className="block text-gray-400 hover:text-white transition">
							Launch App
						</a>
						<button
							onClick={isConnected ? disconnect : connectWallet}
							disabled={isConnecting}
							className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Wallet className="w-4 h-4" />
							{isConnecting
								? 'Connecting...'
								: isConnected && address
									? `${address.slice(0, 6)}...${address.slice(-4)}`
									: 'Connect Wallet'}
						</button>
					</div>
				</motion.div>
			)}
		</motion.header>
	);
}
