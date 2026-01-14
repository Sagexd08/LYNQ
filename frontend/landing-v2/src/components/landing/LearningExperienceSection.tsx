'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lock, Target, Shield, Activity } from 'lucide-react';

export function LearningExperienceSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	const features = [
		{
			icon: Lock,
			title: 'Locked Tokens',
			description: 'Behave like real crypto. Cannot be withdrawn.',
		},
		{
			icon: Target,
			title: 'Guided Actions',
			description: 'Learn by doing — not by reading docs.',
		},
		{
			icon: Shield,
			title: 'No Financial Risk',
			description: "Mistakes don't cost money.",
		},
		{
			icon: Activity,
			title: 'Progress Feedback',
			description: 'See how each action affects your reputation.',
		},
	];

	return (
		<section ref={ref} className="py-20 px-6 bg-gradient-to-b from-black to-violet-950/10">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<h2 className="text-4xl font-bold text-white mb-4">Learning Experience</h2>
					<p className="text-xl text-gray-400">Safe environment to master DeFi fundamentals</p>
				</motion.div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
					{features.map((feature, idx) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={idx}
								initial={{ opacity: 0, y: 30 }}
								animate={isInView ? { opacity: 1, y: 0 } : {}}
								transition={{ duration: 0.5, delay: idx * 0.1 }}
								className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 cursor-pointer"
							>
								<div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
									<Icon className="w-6 h-6 text-cyan-400" />
								</div>
								<h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
								<p className="text-sm text-gray-400">{feature.description}</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
