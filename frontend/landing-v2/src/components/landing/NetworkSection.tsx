'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Spline from '@splinetool/react-spline';

export function NetworkSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	const features = [
		{ text: 'Low fees → viable microloans' },
		{ text: 'Fast finality → better UX' },
		{ text: 'Modular design → scalable credit' },
	];

	return (
		<section ref={ref} className="py-20 px-6 bg-black">
			<div className="max-w-6xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center"
				>
					<h2 className="text-4xl font-bold text-white mb-8">Why Mantle</h2>

					{/* Spline 3D Scene */}
					<div className="w-full h-[400px] mb-8 rounded-xl overflow-hidden">
						<Spline scene="https://prod.spline.design/QXq5yiAIyNxJdTRB/scene.splinecode" />
					</div>

					<div className="space-y-4">
						{features.map((feature, idx) => (
							<motion.div
								key={idx}
								initial={{ opacity: 0, x: -20 }}
								animate={isInView ? { opacity: 1, x: 0 } : {}}
								transition={{ duration: 0.5, delay: idx * 0.1 }}
								className="p-4 rounded-xl bg-white/5 border border-white/10 text-left"
							>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 rounded-full bg-cyan-400" />
									<span className="text-lg text-gray-300">{feature.text}</span>
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
