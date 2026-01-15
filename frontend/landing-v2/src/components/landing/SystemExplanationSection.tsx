'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Brain, Eye, Grid3x3, Zap, LineChart } from 'lucide-react';

const FEATURES = [
	{
		icon: TrendingUp,
		title: 'Reputation Engine',
		description: 'Build verified on-chain reputation through lessons and successful transactions',
		color: 'from-cyan-500 to-blue-500',
	},
	{
		icon: Brain,
		title: 'ML Risk Scoring',
		description: 'Advanced machine learning analyzes portfolio risk in real-time',
		color: 'from-violet-500 to-purple-500',
	},
	{
		icon: Eye,
		title: 'Real-Time Monitoring',
		description: 'Track health factors and liquidation risks across all positions',
		color: 'from-purple-500 to-pink-500',
	},
	{
		icon: Grid3x3,
		title: 'Multi-Asset Pools',
		description: 'Diversify across multiple assets and blockchain networks',
		color: 'from-cyan-500 to-teal-500',
	},
	{
		icon: Zap,
		title: 'Instant Execution',
		description: 'Gas-optimized transactions execute in milliseconds',
		color: 'from-amber-500 to-orange-500',
	},
	{
		icon: LineChart,
		title: 'Analytics Dashboard',
		description: 'Deep insights into your lending performance and portfolio metrics',
		color: 'from-pink-500 to-rose-500',
	},
];

export function SystemExplanationSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	return (
		<section ref={ref} className="py-20 px-6 bg-gradient-to-b from-black to-violet-950/10">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl lg:text-5xl font-bold mb-4">
						<span className="text-white">How </span>
						<span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
							LYNQ Works
						</span>
					</h2>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto">
						Advanced infrastructure combining learning, reputation, and intelligent risk management
					</p>
				</motion.div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{FEATURES.map((feature, idx) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								animate={isInView ? { opacity: 1, y: 0 } : {}}
								transition={{ delay: idx * 0.1, duration: 0.5 }}
								className="group"
							>
								<div className="h-full p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/10 transition-all duration-300">
									<div
										className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}
									>
										<Icon className="w-full h-full text-white" />
									</div>

									<h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors duration-300">
										{feature.title}
									</h3>
									<p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
										{feature.description}
									</p>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
