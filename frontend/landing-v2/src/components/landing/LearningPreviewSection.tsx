'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookOpen, CheckCircle, Award, Clock, ArrowRight } from 'lucide-react';
import { LESSONS } from '@/data/lessons';
import { useLearningStore } from '@/store/useStore';

export function LearningPreviewSection() {
	const ref = useRef(null);
	const isInView = useInView(ref, { margin: '-100px' });
	const { progress } = useLearningStore();

	return (
		<section ref={ref} className="py-20 px-6">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
					transition={{ duration: 0.8 }}
					className="text-center mb-12"
				>
					<div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full text-sm text-blue-400 mb-6">
						<BookOpen className="w-4 h-4" />
						5-Part Curriculum
					</div>
					<h2 className="text-5xl font-bold mb-4">
						<span className="text-white">Master DeFi with</span>{' '}
						<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
							Interactive Lessons
						</span>
					</h2>
					<p className="text-xl text-gray-400 max-w-2xl mx-auto">
						Progress from fundamentals to advanced strategies with quizzes and risk-free simulations
					</p>
				</motion.div>

				<div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
					{LESSONS.map((lesson, idx) => {
						const isCompleted = progress.completedLessons.includes(lesson.id);
						return (
							<motion.div
								key={lesson.id}
								initial={{ opacity: 0, y: 40 }}
								animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
								transition={{ delay: idx * 0.1, duration: 0.8 }}
								className={`p-6 rounded-2xl border transition group cursor-pointer ${
									isCompleted
									? 'bg-gradient-to-br from-cyan-500/20 to-blue-400/10 border-cyan-400/30 hover:border-cyan-400 shadow-lg shadow-cyan-500/10'
									: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/30'
								}`}
							>
								<div className="flex items-start justify-between mb-4">
									<div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
										{isCompleted ? (
											<CheckCircle className="w-6 h-6 text-green-400" />
										) : (
											<BookOpen className="w-6 h-6 text-blue-400" />
										)}
									</div>
									<div className="text-sm font-semibold text-gray-400">Lesson {idx + 1}</div>
								</div>

								<h3 className="font-bold text-white mb-3 group-hover:text-cyan-400 transition">
									{lesson.title}
								</h3>

								<p className="text-sm text-gray-400 mb-4 line-clamp-2">{lesson.description}</p>

								<div className="space-y-2 border-t border-white/10 pt-4">
									<div className="flex items-center gap-2 text-sm text-gray-400">
										<Clock className="w-4 h-4" />
										{lesson.duration}
									</div>
									<div className="flex items-center gap-2 text-sm text-amber-400">
										<Award className="w-4 h-4" />
										+{lesson.reputation} reputation
									</div>
									{isCompleted && (
										<div className="flex items-center gap-2 text-sm text-green-400">
											<CheckCircle className="w-4 h-4" />
											Completed
										</div>
									)}
								</div>
							</motion.div>
						);
					})}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ delay: 0.5, duration: 0.8 }}
					className="mt-12 text-center"
				>
					<a
						href="/learning"
						className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-black font-bold transition shadow-lg shadow-cyan-500/25"
					>
						Start Learning
						<ArrowRight className="w-5 h-5" />
					</a>
				</motion.div>
			</div>
		</section>
	);
}
