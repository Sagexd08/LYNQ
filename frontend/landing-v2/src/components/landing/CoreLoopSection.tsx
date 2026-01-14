'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookOpen, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

export function CoreLoopSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });
	const [activeStep, setActiveStep] = useState(0);

	useEffect(() => {
		if (isInView) {
			const timers = [
				setTimeout(() => setActiveStep(1), 800),
				setTimeout(() => setActiveStep(2), 1600),
				setTimeout(() => setActiveStep(3), 2400),
			];
			return () => timers.forEach(clearTimeout);
		}
	}, [isInView]);

	const steps = [
		{
			icon: BookOpen,
			title: 'Learn Safely',
			description: 'Swap, stake, lend, repay with locked tokens. Real market logic.',
			color: 'from-cyan-500 to-blue-500',
		},
		{
			icon: TrendingUp,
			title: 'Build Reputation',
			description: 'Onchain score tracks consistency, repayment, risk. Transparent progression.',
			color: 'from-violet-500 to-purple-500',
		},
		{
			icon: DollarSign,
			title: 'Unlock Lending',
			description: 'Lower APRs, higher limits, no-collateral tiers (later).',
			color: 'from-purple-500 to-pink-500',
		},
	];

	return (
		<section ref={ref} className="py-24 px-6 bg-black" data-analytics="scroll_core_loop">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
						The{' '}
					<span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
							Core Loop
						</span>
					</h2>
					<p className="text-xl text-gray-400">How LYNQ transforms learning into lending access</p>
				</motion.div>

				<div className="grid md:grid-cols-3 gap-8">
					{steps.map((step, idx) => {
						const Icon = step.icon;
						const isActive = activeStep > idx;

						return (
							<motion.div
								key={idx}
								initial={{ opacity: 0, y: 40 }}
								animate={isInView ? { opacity: 1, y: 0 } : {}}
								transition={{ duration: 0.6, delay: idx * 0.2 }}
								className="relative"
							>
								<div
									className={`p-8 rounded-2xl border transition-all duration-700 ${
										isActive
											? 'bg-gradient-to-br from-white/10 to-white/5 border-cyan-400/40 shadow-lg shadow-cyan-500/20'
											: 'bg-white/5 border-white/10'
									}`}
								>
									<div
										className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} p-4 mb-6 transition-transform duration-500 ${isActive ? 'scale-110' : 'scale-100'}`}
									>
										<Icon className="w-full h-full text-white" />
									</div>

									<div className="mb-2 text-sm font-semibold text-gray-400">Step {idx + 1}</div>
									<h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
									<p className="text-gray-400 leading-relaxed">{step.description}</p>
								</div>

								{idx < steps.length - 1 && (
									<div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
										<ArrowRight
											className={`w-8 h-8 transition-colors duration-700 ${isActive ? 'text-cyan-400' : 'text-gray-600'}`}
										/>
									</div>
								)}
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
