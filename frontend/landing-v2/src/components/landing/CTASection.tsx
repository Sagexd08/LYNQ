'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, BookOpen, Rocket } from 'lucide-react';

export function CTASection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: '-100px' });

	return (
		<section ref={ref} className="py-24 px-6 bg-gradient-to-b from-violet-950/10 to-black">
			<div className="max-w-4xl mx-auto">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={isInView ? { opacity: 1, scale: 1 } : {}}
					transition={{ duration: 0.8 }}
					className="p-12 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/30 text-center"
				>
					<h2 className="text-4xl lg:text-5xl font-bold mb-6">
						<span className="text-white">Start with learning.</span>
						<br />
					<span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
							Earn access to lending.
						</span>
					</h2>

					<p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
						Build your reputation onchain and unlock better lending terms
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center" data-analytics="final_cta_click">
						<a
							href="/learning"
							className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold transition-all shadow-lg shadow-cyan-500/25"
						>
							<BookOpen className="w-5 h-5" />
							Start Learning
							<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</a>
						<a
							href="/app"
							className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all backdrop-blur-sm"
						>
							<Rocket className="w-5 h-5" />
							Launch App
							<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</a>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
