'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Award,
  ArrowRight,

  PlayCircle,
  RotateCcw,

  AlertCircle,
  BookOpen,

  ChevronRight,
  ChevronLeft, // Added ChevronLeft import
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

import { LESSONS } from '@/data/lessons';
import { useLearningStore, useSandboxStore } from '@/store/useStore';

export default function LearningPage() {
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
    <section className="py-20 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl font-medium text-white mb-2 font-sans tracking-tight">Protocol Simulation Environment</h2>
          <p className="text-sm font-mono text-gray-400 uppercase tracking-wider">
            Sandbox Mode // Risk-Free Execution
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 bg-[#0A0A0A] border border-white/10 rounded-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Asset Allocation</h3>
              <div className="space-y-1">
                {Object.entries(sandbox.balances).map(([asset, balance]) => (
                  <div key={asset} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <span className="font-mono text-sm text-white">{asset}</span>
                    <span className="font-mono text-sm text-gray-400">{balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-[#0A0A0A] border border-white/10 rounded-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Health Factor</h3>
                <div className="px-2 py-0.5 border border-white/10 text-[10px] uppercase text-gray-400">
                  Live
                </div>
              </div>
              <div className="text-5xl font-mono mb-2 tracking-tighter text-white">
                {healthFactor.toFixed(2)}
              </div>
              <div className="text-xs font-mono uppercase tracking-wider">
                <span className={healthFactor > 1.5 ? 'text-green-500' : healthFactor > 1 ? 'text-yellow-500' : 'text-red-500'}>
                  STATUS: {healthFactor > 1.5 ? 'SAFE' : healthFactor > 1 ? 'WARNING' : 'LIQUIDATION_RISK'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 border border-white/10 rounded-sm bg-[#0A0A0A]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-8">Execute Transaction</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Operation Type</label>
                <div className="grid grid-cols-3 gap-0 border border-white/10">
                  {(['supply', 'borrow', 'repay'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAction(a)}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${action === a
                        ? 'bg-white text-black'
                        : 'bg-[#0A0A0A] text-gray-500 hover:text-white'
                        }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Select Asset</label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 text-white text-sm font-mono focus:border-white/30 outline-none rounded-sm"
                  >
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="WBTC">WBTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Quantity</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 text-white text-sm font-mono focus:border-white/30 outline-none rounded-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleAction}
                className="w-full px-6 py-4 bg-white text-black hover:bg-gray-200 text-sm font-bold uppercase tracking-wider transition rounded-sm border border-transparent"
              >
                Confirm {action}
              </button>

              <button
                onClick={sandbox.reset}
                className="w-full px-4 py-3 text-xs font-mono text-gray-500 hover:text-white uppercase tracking-wider transition flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 rounded-sm"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Environment
              </button>
            </div>
          </div>
        </div>

        {sandbox.transactions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Recent Chain Activity</h3>
            <div className="space-y-0">
              {sandbox.transactions
                .slice(-5)
                .reverse()
                .map((tx, idx) => (
                  <div key={idx} className="grid grid-cols-4 p-3 border-b border-white/5 font-mono text-sm hover:bg-white/5">
                    <span className="text-gray-400">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    <span className="text-white uppercase font-bold">{tx.type}</span>
                    <span className="text-gray-400">{tx.asset}</span>
                    <span className="text-right text-white">{tx.amount.toFixed(4)}</span>
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
    <section className="py-20 px-6 border-t border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="p-8 bg-[#0A0A0A] border border-white/10 rounded-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-medium text-white mb-1 font-sans">User Progression</h2>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Sync Status</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono text-white mb-1">{Math.round(completionRate)}%</div>
            </div>
          </div>

          <div className="w-full bg-white/5 h-1 mb-12">
            <motion.div
              className="h-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-12">
            <div className="p-6 bg-[#0A0A0A] text-center">
              <div className="text-2xl font-mono text-white mb-1">
                {progress.completedLessons.length}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Modules Cleared</div>
            </div>

            <div className="p-6 bg-[#0A0A0A] text-center">
              <div className="text-2xl font-mono text-green-500 mb-1">{progress.reputation}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Reputation</div>
            </div>

            <div className="p-6 bg-[#0A0A0A] text-center">
              <div className="text-2xl font-mono text-white mb-1">
                {Object.keys(progress.quizScores).length}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Validations</div>
            </div>
          </div>

          {completionRate === 100 ? (
            <div className="p-6 border border-green-500/30 bg-green-500/5 rounded-sm text-center">
              <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-4">Training Complete</h3>
              <p className="text-gray-400 mb-6 font-mono text-xs">User authorized for mainnet protocol interaction.</p>
              <button
                onClick={() => (window.location.href = '/app')}
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold uppercase tracking-wider transition inline-flex items-center gap-2 rounded-sm"
              >
                Enter Protocol
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-6 border border-white/10 bg-white/5 rounded-sm">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Next Module</h4>
                <p className="text-white font-mono">
                  {LESSONS[progress.completedLessons.length]?.title || 'Sequence Complete'}
                </p>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 bg-white hover:bg-gray-200 text-black text-xs font-bold uppercase tracking-wider transition inline-flex items-center gap-2 rounded-sm"
              >
                Resume
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 border border-white/10 rounded-sm overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/10">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Credentials & Badges</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 bg-white/10 gap-px">
            {[
              {
                name: 'First Steps',
                desc: 'Module 1 Complete',
                unlocked: progress.completedLessons.length >= 1,
              },
              {
                name: 'Seeker',
                desc: '3 Modules Complete',
                unlocked: progress.completedLessons.length >= 3,
              },
              {
                name: 'Master',
                desc: 'All Modules Complete',
                unlocked: progress.completedLessons.length === LESSONS.length,
              },
              {
                name: 'Analyst',
                desc: '100% Quiz Accuracy',
                unlocked: Object.keys(progress.quizScores).length === LESSONS.length,
              },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`p-6 bg-[#0A0A0A] text-center transition ${badge.unlocked
                  ? 'opacity-100'
                  : 'opacity-30'
                  }`}
              >
                <div className="text-xs mb-2 font-mono">{badge.unlocked ? '[UNLOCKED]' : '[LOCKED]'}</div>
                <div className="font-bold text-white text-xs uppercase tracking-wider mb-1">{badge.name}</div>
                <div className="text-[10px] text-gray-500 font-mono">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


