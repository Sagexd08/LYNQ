'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Code, Lock, CheckCircle } from 'lucide-react';

export function SecuritySection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	const items = [
		{ icon: Shield, text: 'Audited contracts' },
		{ icon: Code, text: 'Open source' },
		{ icon: Lock, text: 'Non-custodial' },
		{ icon: CheckCircle, text: 'Progressive compliance' },
	];

	return (
		<section ref={ref} className="py-20 px-6 bg-gradient-to-b from-black to-violet-950/10">
			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<h2 className="text-4xl font-bold text-white mb-4">Security & Trust</h2>
				</motion.div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
					{items.map((item, idx) => {
						const Icon = item.icon;
						return (
							<motion.div
								key={idx}
								initial={{ opacity: 0, y: 30 }}
								animate={isInView ? { opacity: 1, y: 0 } : {}}
								transition={{ duration: 0.5, delay: idx * 0.1 }}
								className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300"
							>
								<Icon className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
								<div className="text-gray-300 font-medium">{item.text}</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
