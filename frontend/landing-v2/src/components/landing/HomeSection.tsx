'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Rocket } from 'lucide-react';
import Spline from '@splinetool/react-spline';

export function HomeSection() {
	return (
		<section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6 overflow-hidden bg-black">
			{/* Background glow */}
			<div className="absolute inset-0 opacity-30 pointer-events-none">
				<div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 blur-3xl rounded-full" />
				<div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/20 blur-3xl rounded-full" />
			</div>

			<div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
				{/* Left: Copy */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
						<span className="text-white">Learn DeFi.</span>
						<br />
						<span className="text-white">Build Reputation.</span>
						<br />
						<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
							Unlock Lending.
						</span>
					</h1>

					<p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
						Practice on Mantle with locked tokens.
						<br />
						Build verifiable onchain reputation.
						<br />
						Access real lending — when you're ready.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 mb-10">
						<a
							href="/learning"
							className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-semibold transition-all shadow-lg shadow-cyan-500/25"
							data-analytics="hero_start_learning_click"
						>
							<BookOpen className="w-5 h-5" />
							Start Learning
							<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</a>
						<a
							href="/app"
							className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold transition-all backdrop-blur-sm"
							data-analytics="hero_launch_app_click"
						>
							<Rocket className="w-5 h-5" />
							Launch App
							<ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
						</a>
					</div>


				</motion.div>

				{/* Right: 3D Spline Scene */}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 0.2 }}
					className="relative h-[500px] lg:h-full lg:min-h-[600px] overflow-hidden"
				>
					<Suspense
						fallback={
							<div className="w-full h-full flex items-center justify-center">
								<span className="text-gray-400">Loading 3D scene...</span>
							</div>
						}
					>
						<div className="w-full h-full">
							<Spline scene="https://prod.spline.design/fVI7osVNsN6xgxlO/scene.splinecode" />
						</div>
					</Suspense>
				</motion.div>
			</div>
		</section>
	);
}
