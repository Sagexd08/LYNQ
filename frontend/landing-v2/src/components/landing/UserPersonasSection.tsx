'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, TrendingUp, Zap } from 'lucide-react';

export function UserPersonasSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	const personas = [
		{
			icon: Users,
			title: 'New to Web3',
			description: 'Learn without fear. Build confidence before risking real money.',
			color: 'from-cyan-500 to-blue-500',
		},
		{
			icon: TrendingUp,
			title: 'Experienced User',
			description: 'Earn better terms through verified onchain behavior.',
			color: 'from-violet-500 to-purple-500',
		},
		{
			icon: Zap,
			title: 'Power User',
			description: 'Transparent, composable system with no hidden logic.',
			color: 'from-purple-500 to-pink-500',
		},
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
					<h2 className="text-4xl font-bold text-white mb-4">Built for Everyone</h2>
				</motion.div>

				<div className="grid md:grid-cols-3 gap-8">
					{personas.map((persona, idx) => {
						const Icon = persona.icon;
						return (
							<motion.div
								key={idx}
								initial={{ opacity: 0, y: 30 }}
								animate={isInView ? { opacity: 1, y: 0 } : {}}
								transition={{ duration: 0.6, delay: idx * 0.15 }}
								className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
							>
								<div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${persona.color} p-3 mb-6`}>
									<Icon className="w-full h-full text-white" />
								</div>
								<h3 className="text-xl font-bold text-white mb-3">{persona.title}</h3>
								<p className="text-gray-400">{persona.description}</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
