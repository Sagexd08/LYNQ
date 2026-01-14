'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Award, CheckCircle, Activity, Eye, BookOpen } from 'lucide-react';

export function ReputationSystemSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	const tiers = [
		{ name: 'Bronze', color: 'from-amber-600 to-amber-500', unlocks: ['Basic lending', 'Standard rates'] },
		{ name: 'Silver', color: 'from-gray-400 to-gray-300', unlocks: ['Higher limits', 'Reduced APR'] },
		{
			name: 'Gold',
			color: 'from-yellow-500 to-yellow-400',
			unlocks: ['Premium access', 'Best rates', 'No-collateral (future)'],
		},
	];

	const signals = [
		{ icon: CheckCircle, text: 'Successful repayments' },
		{ icon: Activity, text: 'Time consistency' },
		{ icon: Eye, text: 'Risk management' },
		{ icon: BookOpen, text: 'Learning completion' },
	];

	return (
		<section ref={ref} className="py-20 px-6 bg-black">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<h2 className="text-4xl font-bold text-white mb-4">Reputation System</h2>
					<p className="text-xl text-gray-300 mb-2">Reputation is earned, not claimed.</p>
					<p className="text-gray-400">Every update is recorded onchain.</p>
				</motion.div>

				<div className="grid lg:grid-cols-2 gap-12 items-start">
					{/* Tier Ladder */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<div className="space-y-4">
							{tiers.map((tier, idx) => (
								<div
									key={idx}
									className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
								>
									<div className="flex items-center gap-4 mb-4">
										<div
											className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}
										>
											<Award className="w-6 h-6 text-white" />
										</div>
										<h3 className="text-2xl font-bold text-white">{tier.name}</h3>
									</div>
									<div className="space-y-2">
										{tier.unlocks.map((unlock, i) => (
											<div key={i} className="flex items-center gap-2 text-sm text-gray-400">
												<div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
												{unlock}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</motion.div>

					{/* What Affects Score */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<div className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-400/20">
							<h3 className="text-2xl font-bold text-white mb-6">What Affects Your Score</h3>
							<div className="space-y-4">
								{signals.map((signal, idx) => {
									const Icon = signal.icon;
									return (
										<div
											key={idx}
											className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
										>
											<Icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
											<span className="text-gray-300">{signal.text}</span>
										</div>
									);
								})}
							</div>
							<div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
								<p className="text-sm text-cyan-300">
									All reputation changes are transparent and verifiable onchain. No hidden algorithms.
								</p>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
