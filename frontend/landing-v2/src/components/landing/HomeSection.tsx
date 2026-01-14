'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Rocket } from 'lucide-react';
import Spline from '@splinetool/react-spline';

export function HomeSection() {
	return (
		<section className="relative min-h-screen flex items-center justify-center pt-24 px-6 overflow-hidden bg-black">
			<div className="absolute inset-0 opacity-40">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 blur-3xl rounded-full" />
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/30 blur-3xl rounded-full" />
				<div className="absolute top-1/2 right-1/4 w-96 h-96 bg-fuchsia-500/20 blur-3xl rounded-full" />
			</div>

			<div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
				{}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.8 }}
				>
					<h1 className="text-6xl lg:text-7xl font-bold mb-6">
						<span className="text-white">Borrow. </span>
						<span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Build. Belong.</span>
					</h1>

					<p className="text-xl text-white/80 max-w-2xl mb-10">
						Learn DeFi risk-free, build your reputation on-chain, then access real lending markets with confidence.
					</p>

					<div className="flex flex-col sm:flex-row gap-4">
						<a
							href="/learning"
							className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-white font-bold transition shadow-lg shadow-cyan-500/25"
						>
							<BookOpen className="w-5 h-5" />
							Start Learning
							<ArrowRight className="w-5 h-5" />
						</a>
						<a
							href="/app"
							className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition backdrop-blur-xl"
						>
							<Rocket className="w-5 h-5" />
							Launch App
							<ArrowRight className="w-5 h-5" />
						</a>
					</div>
				</motion.div>

				{}
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 1, delay: 0.2 }}
					className="relative h-[500px] lg:h-full lg:min-h-[600px]"
				>
					<Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center"><span className="text-gray-400">Loading 3D scene...</span></div>}>
						<Spline scene="https://prod.spline.design/fVI7osVNsN6xgxlO/scene.splinecode" />
					</Suspense>
				</motion.div>
			</div>
		</section>
	);
}
