'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';

const NETWORKS = [
	{ name: 'Mantle', emoji: '🟢', status: 'Live', live: true },
	{ name: 'Ethereum', emoji: '⟠', status: 'Coming Soon', live: false },
	{ name: 'Polygon', emoji: '🟣', status: 'Coming Soon', live: false },
	{ name: 'Arbitrum', emoji: '🔵', status: 'Coming Soon', live: false },
	{ name: 'Base', emoji: '🟦', status: 'Coming Soon', live: false },
];

export function NetworkSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { margin: '-100px' });

	return (
		<section ref={ref} className="py-20 px-6">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
					transition={{ duration: 0.8 }}
					className="text-center mb-16"
				>
					<h2 className="text-5xl font-bold mb-4">
						<span className="text-white">Multichain</span>{' '}
						<span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
							Support
						</span>
					</h2>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto">
						Seamless access across multiple blockchain networks
					</p>
				</motion.div>

				<div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
					{NETWORKS.map((network, idx) => (
						<motion.div
							key={network.name}
							initial={{ opacity: 0, y: 40 }}
							animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
							transition={{ delay: idx * 0.08, duration: 0.8 }}
							className="group cursor-pointer"
						>
							<div
								className={`h-full p-8 rounded-2xl border transition duration-300 ${
									network.live
										? 'bg-gradient-to-br from-cyan-500/20 to-blue-400/10 border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-500/30 shadow-lg shadow-cyan-500/10'
										: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/30'
								}`}
							>
								<div className="flex flex-col items-center gap-6">
									<div className="text-6xl">{network.emoji}</div>

									<div className="text-center">
										<h3 className="text-2xl font-bold text-white mb-3">{network.name}</h3>

										<div
											className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
												network.live
													? 'bg-green-500/20 text-green-400'
													: 'bg-gray-500/20 text-gray-400'
											}`}
										>
											{network.live ? (
												<>
													<CheckCircle className="w-4 h-4" />
													{network.status}
												</>
											) : (
												<>
													<Clock className="w-4 h-4" />
													{network.status}
												</>
											)}
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
