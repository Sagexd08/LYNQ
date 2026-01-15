'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  RotateCcw,
  DollarSign,
  AlertCircle,
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft, // Added ChevronLeft import
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

import { LESSONS } from '@/data/lessons';
import { useLearningStore, useSandboxStore } from '@/store/useStore';

function LearningPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Infrastructure Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] bg-[size:100%_4px] opacity-10" />
      </div>

      <Header />
      <div className="relative z-10 font-mono">
        <LearningHero />
        <LessonSlides />
        <Sandbox />
        <ProgressTracker />
        <Footer />
      </div>
    </div>
  );
}

function LearningHero() {
  const { progress } = useLearningStore();
  const completionRate = (progress.completedLessons.length / LESSONS.length) * 100;

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-xs font-medium text-gray-400 uppercase tracking-widest mb-8">
            <BookOpen className="w-3 h-3" />
            Interactive Learning Protocol
          </div>

          <h1 className="text-5xl lg:text-6xl font-medium mb-6 tracking-tight">
            <span className="text-white">Master DeFi</span>{' '}
            <span className="text-gray-500">
              Risk-Free
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-sans border-l-2 border-white/10 pl-6 text-left">
            Execute credit operations safely. Build verifiable on-chain reputation.
            Simulate lending strategies before capital deployment.
          </p>

          <div className="max-w-2xl mx-auto p-6 bg-[#0A0A0A] border border-white/10 rounded-sm">
            <div className="flex items-center justify-between mb-4 font-mono">
              <div className="text-left">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Progress Index</div>
                <div className="text-2xl font-bold text-white">
                  {progress.completedLessons.length}<span className="text-gray-600 text-lg">/{LESSONS.length}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reputation Score</div>
                <div className="flex items-center justify-end gap-2 text-2xl font-bold text-white">
                  <Award className="w-5 h-5 text-green-500" />
                  {progress.reputation}
                </div>
              </div>
            </div>

            <div className="w-full bg-white/5 h-1">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            <div className="mt-3 flex justify-between text-[10px] text-gray-500 uppercase tracking-wider font-mono">
              <span>Status: {completionRate === 100 ? 'COMPLETED' : 'IN_PROGRESS'}</span>
              <span>{Math.round(completionRate)}% SYNCED</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface QuizProps {
  quiz: any;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  onSubmit: () => void;
  submitted: boolean;
}

function Quiz({ quiz, selectedAnswer, onSelectAnswer, onSubmit, submitted }: QuizProps) {
  const isCorrect = selectedAnswer === quiz.correctIndex;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-white/5 border-l-2 border-white/20">
        <AlertCircle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Knowledge Check</h3>
          <p className="text-gray-400 text-xs font-sans">
            Verify comprehension to proceed. Reputation points awarded for accuracy.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-medium text-white mb-6 font-sans">{quiz.question}</h3>

        <div className="space-y-2">
          {quiz.options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => !submitted && onSelectAnswer(idx)}
              disabled={submitted}
              className={`w-full p-4 text-left transition border ${submitted
                ? idx === quiz.correctIndex
                  ? 'bg-green-500/10 border-green-500 text-white'
                  : idx === selectedAnswer
                    ? 'bg-red-500/10 border-red-500 text-white'
                    : 'bg-[#0A0A0A] border-white/5 text-gray-500'
                : idx === selectedAnswer
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-[#0A0A0A] border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/20 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-4">
                <div className="font-mono text-xs text-gray-500">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="font-sans text-sm">{option}</span>
                {submitted && idx === quiz.correctIndex && (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                )}
                {submitted && idx === selectedAnswer && idx !== quiz.correctIndex && (
                  <XCircle className="w-4 h-4 text-red-500 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`p-4 border-l-2 ${isCorrect
            ? 'border-green-500 bg-green-500/5'
            : 'border-red-500 bg-red-500/5'
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="font-mono text-xs uppercase font-bold tracking-wider mb-1 text-gray-400">
              Analysis
            </div>
          </div>
          <p className={`font-mono text-xs uppercase font-bold mb-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isCorrect ? 'CORRECT_RESPONSE' : 'INCORRECT_RESPONSE'}
          </p>
          <p className="text-gray-300 text-sm font-sans">{quiz.explanation}</p>
        </motion.div>
      )}

      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={selectedAnswer === null}
          className="w-full px-6 py-3 bg-white text-black hover:bg-gray-200 text-sm font-bold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
        >
          Submit Response
        </button>
      )}
    </div>
  );
}

function LessonSlides() {
  const { progress, completeLesson } = useLearningStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const currentLesson = LESSONS[currentIndex];
  const isCompleted = progress.completedLessons.includes(currentLesson.id);

  const handleNext = () => {
    if (currentIndex < LESSONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowQuiz(false);
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowQuiz(false);
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (quizAnswer === currentLesson.quiz![0].correctIndex) {
      setTimeout(() => {
        completeLesson(currentLesson.id);
      }, 1500);
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div className="flex gap-2 items-center">
            {LESSONS.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowQuiz(false);
                  setQuizAnswer(null);
                  setQuizSubmitted(false);
                }}
                className={`w-8 h-8 flex items-center justify-center font-mono text-xs border transition ${idx === currentIndex
                  ? 'bg-white text-black border-white'
                  : progress.completedLessons.includes(lesson.id)
                    ? 'bg-green-500/10 text-green-500 border-green-500/30'
                    : 'bg-[#0A0A0A] text-gray-500 border-white/10'
                  }`}
              >
                {progress.completedLessons.includes(lesson.id) ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  idx + 1
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-8 h-8 flex items-center justify-center border border-white/10 bg-[#0A0A0A] hover:bg-white/5 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === LESSONS.length - 1}
              className="w-8 h-8 flex items-center justify-center border border-white/10 bg-[#0A0A0A] hover:bg-white/5 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0A0A0A] border border-white/10 p-8 lg:p-12"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-3xl font-medium text-white mb-2 font-sans">{currentLesson.title}</h2>
                <div className="flex items-center gap-4 text-xs font-mono text-gray-500 uppercase tracking-wider">
                  <span>ID: {currentLesson.id}</span>
                  <span>Ver: 1.0.0</span>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-gray-500 mb-1">REWARD</div>
                <div className="text-green-500">+{currentLesson.reputation} REP</div>
              </div>
            </div>

            {!showQuiz ? (
              <>
                <p className="text-lg text-gray-300 mb-12 leading-relaxed font-sans max-w-3xl">{currentLesson.content}</p>

                <div className="flex gap-4 border-t border-white/10 pt-8">
                  {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="px-6 py-3 bg-white text-black hover:bg-gray-200 text-sm font-bold uppercase tracking-wider transition flex items-center gap-3 rounded-sm"
                    >
                      Initialize Quiz
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {currentLesson.sandboxTask && (
                    <button className="px-6 py-3 border border-white/20 text-white hover:bg-white/5 text-sm font-bold uppercase tracking-wider transition flex items-center gap-3 rounded-sm">
                      <PlayCircle className="w-4 h-4" />
                      Run Simulation
                    </button>
                  )}
                </div>
              </>
            ) : currentLesson.quiz && currentLesson.quiz.length > 0 ? (
              <Quiz
                quiz={currentLesson.quiz[0]}
                selectedAnswer={quizAnswer}
                onSelectAnswer={setQuizAnswer}
                onSubmit={handleQuizSubmit}
                submitted={quizSubmitted}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Sandbox() {
  const sandbox = useSandboxStore();
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'supply' | 'borrow' | 'repay'>('supply');

  const handleAction = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    if (action === 'supply') sandbox.supply(selectedAsset, amt);
    else if (action === 'borrow') sandbox.borrow(selectedAsset, amt);
    else if (action === 'repay') sandbox.repay(selectedAsset, amt);

    setAmount('');
  };

  const totalSupplied = Object.values(sandbox.balances).reduce((a, b) => a + b, 0);
  const healthFactor = totalSupplied > 0 ? 2.5 : 1;

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black to-violet-950/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-white">Risk-Free</span>{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Practice Sandbox
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Practice lending operations with simulated funds. No real money at risk.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          { }
          <div className="space-y-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Your Balances</h3>
              <div className="space-y-3">
                {Object.entries(sandbox.balances).map(([asset, balance]) => (
                  <div key={asset} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <span className="font-semibold text-white">{asset}</span>
                    <span className="text-gray-400">{balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Health Factor</h3>
              <div className="text-4xl font-bold mb-2">
                <span
                  className={
                    healthFactor > 1.5
                      ? 'text-green-400'
                      : healthFactor > 1
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {healthFactor.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {healthFactor > 1.5 ? 'Safe' : healthFactor > 1 ? 'Caution' : 'Liquidation Risk'}
              </div>
            </div>
          </div>

          { }
          <div className="p-8 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-400/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Take Action</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['supply', 'borrow', 'repay'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className={`px-4 py-3 rounded-xl font-semibold transition ${action === a
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                    >
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Asset</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                >
                  <option value="USDC">USDC</option>
                  <option value="ETH">ETH</option>
                  <option value="WBTC">WBTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              </div>

              <button
                onClick={handleAction}
                className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold transition"
              >
                Execute {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>

              <button
                onClick={sandbox.reset}
                className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-semibold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Sandbox
              </button>
            </div>
          </div>
        </div>

        { }
        {sandbox.transactions.length > 0 && (
          <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
            <div className="space-y-2">
              {sandbox.transactions
                .slice(-5)
                .reverse()
                .map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white capitalize">{tx.type}</div>
                        <div className="text-sm text-gray-400">{tx.asset}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">{tx.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressTracker() {
  const { progress } = useLearningStore();
  const completionRate = (progress.completedLessons.length / LESSONS.length) * 100;

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-400/30 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Your Learning Progress</h2>
              <p className="text-gray-400">Track your journey to DeFi mastery</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white mb-1">{Math.round(completionRate)}%</div>
              <div className="text-sm text-gray-400">Complete</div>
            </div>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-4 mb-8 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white/5 rounded-xl text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">
                {progress.completedLessons.length}
              </div>
              <div className="text-sm text-gray-400">Lessons Completed</div>
            </div>

            <div className="p-6 bg-white/5 rounded-xl text-center">
              <div className="text-3xl font-bold text-violet-400 mb-2">{progress.reputation}</div>
              <div className="text-sm text-gray-400">Reputation Points</div>
            </div>

            <div className="p-6 bg-white/5 rounded-xl text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {Object.keys(progress.quizScores).length}
              </div>
              <div className="text-sm text-gray-400">Quizzes Passed</div>
            </div>
          </div>

          {completionRate === 100 ? (
            <div className="p-6 bg-green-500/20 border-2 border-green-400 rounded-xl text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
              <p className="text-gray-300 mb-6">You've completed all lessons. You're ready to start lending!</p>
              <button
                onClick={() => (window.location.href = '/app')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold transition inline-flex items-center gap-2"
              >
                Launch Lending App
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-6 bg-blue-500/10 border border-blue-400/30 rounded-xl">
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Next Lesson</h4>
                <p className="text-gray-400">
                  {LESSONS[progress.completedLessons.length]?.title || 'All done!'}
                </p>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-semibold transition inline-flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        { }
        <div className="mt-8 p-8 bg-white/5 border border-white/10 rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-6">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: 'First Steps',
                desc: 'Complete first lesson',
                unlocked: progress.completedLessons.length >= 1,
                icon: '🌱',
              },
              {
                name: 'Knowledge Seeker',
                desc: 'Complete 3 lessons',
                unlocked: progress.completedLessons.length >= 3,
                icon: '📚',
              },
              {
                name: 'DeFi Master',
                desc: 'Complete all lessons',
                unlocked: progress.completedLessons.length === LESSONS.length,
                icon: '🎓',
              },
              {
                name: 'Quiz Pro',
                desc: 'Pass all quizzes',
                unlocked: Object.keys(progress.quizScores).length === LESSONS.length,
                icon: '🏆',
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-xl text-center transition ${badge.unlocked
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400'
                  : 'bg-white/5 border border-white/10 opacity-50'
                  }`}
              >
                <div className="text-4xl mb-2">{badge.unlocked ? badge.icon : '🔒'}</div>
                <div className="font-bold text-white text-sm mb-1">{badge.name}</div>
                <div className="text-xs text-gray-400">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LearningPage() {
  return (
    <div className="bg-black text-white min-h-screen relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/20 blur-[100px] rounded-full" />
      </div>

      <Header />
      <div className="relative z-10">
        <LearningHero />
        <LessonSlides />
        <Sandbox />
        <ProgressTracker />
        <Footer />
      </div>
    </div>
  );
}
