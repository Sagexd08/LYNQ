'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, BookOpen, Rocket, Lock, Zap } from 'lucide-react';

const FEATURES = [
	{ icon: Lock, label: 'Audited Smart Contracts' },
	{ icon: BookOpen, label: 'Open Source' },
	{ icon: Zap, label: 'Non-Custodial' },
	{ icon: Rocket, label: 'Decentralized' },
];

export function CTASection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { margin: '-100px' });

	return (
		<section ref={ref} className="py-24 px-6">
			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.8 }}
					className="p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 text-center"
				>
					<h2 className="text-6xl font-bold mb-6">
						<span className="text-white">Ready to Start</span>{' '}
						<span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
							Your Journey?
						</span>
					</h2>

					<p className="text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
						Learn DeFi fundamentals risk-free, build reputation, and unlock access to our lending platform
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
						<a
							href="/learning"
							className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-white font-bold transition flex items-center justify-center gap-2 group"
						>
							<BookOpen className="w-5 h-5" />
							Start Learning
							<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
						</a>
						<a
							href="/app"
							className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition flex items-center justify-center gap-2 group"
						>
							<Rocket className="w-5 h-5" />
							Launch App
							<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
						</a>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10">
						{FEATURES.map((feature, idx) => {
							const Icon = feature.icon;
							return (
								<motion.div
									key={feature.label}
									initial={{ opacity: 0, y: 20 }}
									animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
									transition={{ delay: idx * 0.1, duration: 0.8 }}
									className="flex flex-col items-center gap-3"
								>
									<div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
										<Icon className="w-6 h-6 text-cyan-400" />
									</div>
									<span className="text-sm font-semibold text-gray-300 text-center">{feature.label}</span>
								</motion.div>
							);
						})}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
