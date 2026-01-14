'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DollarSign, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export function LendingExperienceSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	return (
		<section ref={ref} className="py-20 px-6 bg-gradient-to-b from-violet-950/10 to-black">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<h2 className="text-4xl font-bold text-white mb-4">Lending Experience</h2>
					<p className="text-xl text-gray-400">Two pathways designed for your level</p>
				</motion.div>

				<div className="grid lg:grid-cols-2 gap-8">
					{/* Collateralized Loans */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-400/20"
					>
						<DollarSign className="w-12 h-12 text-violet-400 mb-4" />
						<h3 className="text-2xl font-bold text-white mb-4">Collateralized Loans</h3>
						<p className="text-gray-400 mb-6">For experienced users with crypto assets</p>

						<div className="space-y-3">
							{[
								'Supply crypto as collateral',
								'Borrow stablecoins instantly',
								'Transparent LTV ratios',
								'Clear liquidation rules',
							].map((item, idx) => (
								<div key={idx} className="flex items-center gap-3">
									<CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0" />
									<span className="text-gray-300">{item}</span>
								</div>
							))}
						</div>
					</motion.div>

					{/* Beginner Loans */}
					<motion.div
						initial={{ opacity: 0, x: 30 }}
						animate={isInView ? { opacity: 1, x: 0 } : {}}
						transition={{ duration: 0.6, delay: 0.3 }}
						className="p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20"
					>
						<BookOpen className="w-12 h-12 text-cyan-400 mb-4" />
						<h3 className="text-2xl font-bold text-white mb-4">Beginner Loans</h3>
						<p className="text-gray-400 mb-6">Build your way to larger limits</p>

						<div className="space-y-3">
							{[
								'Smaller initial limits',
								'Reputation-gated access',
								'Progressive identity verification',
								'KYC only when needed',
							].map((item, idx) => (
								<div key={idx} className="flex items-center gap-3">
									<CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
									<span className="text-gray-300">{item}</span>
								</div>
							))}
						</div>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6, delay: 0.5 }}
					className="mt-8 text-center"
				>
					<a
						href="/app"
						className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold transition-all shadow-lg shadow-cyan-500/25"
					>
						Check Loan Access
						<ArrowRight className="w-5 h-5" />
					</a>
				</motion.div>
			</div>
		</section>
	);
}
