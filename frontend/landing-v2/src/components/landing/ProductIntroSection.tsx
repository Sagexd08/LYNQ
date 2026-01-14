'use client';

import { motion, useInView } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useRef } from 'react';

export function ProductIntroSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	return (
		<section ref={ref} className="py-24 px-6 bg-black">
			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center"
				>
					<h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">What is LYNQ?</h2>
					<p className="text-xl text-gray-300 mb-8 leading-relaxed">
						LYNQ is a learning-first DeFi lending platform on Mantle.
						<br />
						You don't start by borrowing — you start by learning.
					</p>

					<div className="grid md:grid-cols-2 gap-4 text-left mt-12">
						{[
							'Practice real DeFi actions with non-withdrawable tokens',
							'Every action builds onchain reputation',
							'Reputation unlocks better loan access and rates',
							'No upfront risk. No forced complexity.',
						].map((text, idx) => (
							<motion.div
								key={idx}
								initial={{ opacity: 0, x: -20 }}
								animate={isInView ? { opacity: 1, x: 0 } : {}}
								transition={{ duration: 0.5, delay: idx * 0.1 }}
								className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
							>
								<CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
								<span className="text-gray-300">{text}</span>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
