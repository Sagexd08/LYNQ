import { useMemo, useState } from 'react';
import { Award, CheckCircle2, Play } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/shared/Buttons';
import { LESSONS } from '@/data/lessons';
import { useLearningStore } from '@/store/useStore';

export default function LearningExperience() {
	const { progress, setCurrentLesson, completeLesson } = useLearningStore();
	const [selectedLessonId, setSelectedLessonId] = useState<string>(
		progress.currentLesson ?? LESSONS[0]?.id,
	);

	const activeLesson = useMemo(
		() => LESSONS.find((lesson) => lesson.id === selectedLessonId) ?? LESSONS[0],
		[selectedLessonId],
	);

	const handleStart = (lessonId: string) => {
		setSelectedLessonId(lessonId);
		setCurrentLesson(lessonId);
	};

	const handleComplete = () => {
		if (activeLesson) {
			completeLesson(activeLesson.id);
		}
	};

	if (!activeLesson) return null;

	return (
		<div className="bg-black text-white min-h-screen">
			<Header />
			<main className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
				<div className="flex flex-col lg:flex-row gap-8 mb-10">
					<div className="flex-1 bg-gradient-to-br from-slate-900 to-black border border-cyan-400/20 rounded-3xl p-6">
						<p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80 mb-2">Your progress</p>
						<h1 className="text-3xl font-bold mb-4">Learning Path</h1>
						<div className="grid sm:grid-cols-3 gap-4">
							<Stat label="Completed" value={`${progress.completedLessons.length}/${LESSONS.length}`} />
							<Stat label="Reputation" value={`+${progress.reputation}`} />
							<Stat
								label="Current"
								value={
									progress.currentLesson
										? LESSONS.find((l) => l.id === progress.currentLesson)?.title ?? 'Not started'
										: 'Not started'
								}
							/>
						</div>
					</div>

					<div className="w-full lg:w-80 bg-white/5 border border-white/10 rounded-3xl p-6">
						<h2 className="text-xl font-semibold mb-4">Lessons</h2>
						<div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
							{LESSONS.map((lesson) => {
								const isActive = lesson.id === activeLesson.id;
								const completed = progress.completedLessons.includes(lesson.id);
								return (
									<button
										key={lesson.id}
										onClick={() => handleStart(lesson.id)}
										className={`w-full text-left p-4 rounded-2xl border transition ${
											isActive ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/5'
										}`}
									>
										<div className="flex items-center justify-between mb-1">
											<span className="text-sm font-semibold text-white">{lesson.title}</span>
											{completed && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
										</div>
										<p className="text-xs text-gray-400">{lesson.duration}</p>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
					<div className="bg-white/5 border border-white/10 rounded-3xl p-6">
						<div className="flex items-center justify-between mb-3">
							<div className="text-sm px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/20">
								{activeLesson.duration}
							</div>
							<div className="text-sm text-cyan-200 font-semibold">+{activeLesson.reputation} RP</div>
						</div>
						<h2 className="text-2xl font-bold mb-2">{activeLesson.title}</h2>
						<p className="text-gray-300 mb-6">{activeLesson.description}</p>

						<div className="bg-black/60 border border-white/10 rounded-2xl p-4">
							<div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
								{activeLesson.content.trim()}
							</div>
						</div>

						<div className="flex gap-3 mt-6">
							<Button onClick={() => handleStart(activeLesson.id)}>
								Start lesson
								<Play className="w-4 h-4" />
							</Button>
							<Button variant="secondary" onClick={handleComplete}>
								Mark complete
								<CheckCircle2 className="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div className="bg-gradient-to-br from-slate-900 to-black border border-cyan-400/20 rounded-3xl p-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-100">
								<Award className="w-5 h-5" />
							</div>
							<div>
								<p className="text-sm text-gray-300">Your reputation</p>
								<p className="text-2xl font-bold">{progress.reputation} RP</p>
							</div>
						</div>
						<p className="text-gray-300 text-sm leading-relaxed">
							Reputation improves your borrowing terms in the live app. Complete lessons, ace quizzes, and maintain a
							healthy sandbox to keep climbing.
						</p>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="p-4 rounded-2xl border border-white/10 bg-white/5">
			<p className="text-sm text-gray-400">{label}</p>
			<p className="text-xl font-semibold text-white">{value}</p>
		</div>
	);
}
