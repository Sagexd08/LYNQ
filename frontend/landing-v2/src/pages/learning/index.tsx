'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  RotateCcw,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Clock,
  Target,
} from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/shared/Buttons';
import { LESSONS } from '@/data/lessons';
import { useLearningStore, useSandboxStore } from '@/store/useStore';

function LearningHero() {
  const { progress } = useLearningStore();
  const completionRate = (progress.completedLessons.length / LESSONS.length) * 100;

  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-black to-blue-950/10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-400/30 rounded-full text-sm text-blue-400 mb-6">
            <BookOpen className="w-4 h-4" />
            Interactive Learning Experience
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">Master DeFi</span>{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Risk-Free
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Learn through interactive lessons, practice with simulations, and build your reputation
            before risking real capital.
          </p>

          {}
          <div className="max-w-2xl mx-auto p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <div className="text-sm text-gray-400 mb-1">Your Progress</div>
                <div className="text-3xl font-bold text-white">
                  {progress.completedLessons.length} / {LESSONS.length}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">Reputation</div>
                <div className="flex items-center gap-2 text-2xl font-bold text-violet-400">
                  <Award className="w-6 h-6" />
                  {progress.reputation}
                </div>
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1 }}
              />
            </div>

            <div className="mt-4 text-sm text-gray-400">
              {completionRate === 100
                ? '🎉 Congratulations! All lessons completed!'
                : `${Math.round(completionRate)}% complete - Keep going!`}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Quiz({ quiz, selectedAnswer, onSelectAnswer, onSubmit, submitted }) {
  const isCorrect = selectedAnswer === quiz.correctIndex;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Knowledge Check</h3>
          <p className="text-gray-400 text-sm">
            Answer correctly to complete this lesson and earn reputation points
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white mb-6">{quiz.question}</h3>

        <div className="space-y-3">
          {quiz.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => !submitted && onSelectAnswer(idx)}
              disabled={submitted}
              className={`w-full p-4 rounded-xl text-left transition border-2 ${
                submitted
                  ? idx === quiz.correctIndex
                    ? 'bg-green-500/20 border-green-400 text-white'
                    : idx === selectedAnswer
                    ? 'bg-red-500/20 border-red-400 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400'
                  : idx === selectedAnswer
                  ? 'bg-cyan-500/20 border-cyan-400 text-white'
                  : 'bg-white/5 border-white/10 text-white hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    submitted
                      ? idx === quiz.correctIndex
                        ? 'bg-green-500 text-white'
                        : idx === selectedAnswer
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-gray-400'
                      : idx === selectedAnswer
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {submitted && idx === quiz.correctIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : submitted && idx === selectedAnswer ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border-2 ${
            isCorrect
              ? 'bg-green-500/10 border-green-400'
              : 'bg-red-500/10 border-red-400'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            )}
            <div>
              <h4
                className={`text-lg font-bold mb-2 ${
                  isCorrect ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {isCorrect ? 'Correct! Well done!' : 'Not quite right'}
              </h4>
              <p className="text-gray-300">{quiz.explanation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={selectedAnswer === null}
          className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}

function LessonSlides() {
  const { progress, completeLesson, setCurrentLesson } = useLearningStore();
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
        {}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {LESSONS.map((lesson, idx) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowQuiz(false);
                  setQuizAnswer(null);
                  setQuizSubmitted(false);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  idx === currentIndex
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : progress.completedLessons.includes(lesson.id)
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {progress.completedLessons.includes(lesson.id) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  idx + 1
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === LESSONS.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-3">{currentLesson.title}</h2>
                <p className="text-lg text-gray-400">{currentLesson.description}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {currentLesson.duration}
                </div>
                <div className="flex items-center gap-2 text-sm text-violet-400">
                  <Award className="w-4 h-4" />
                  +{currentLesson.reputation} rep
                </div>
                {isCompleted && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </div>
                )}
              </div>
            </div>

            {!showQuiz ? (
              <>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">{currentLesson.content}</p>

                <div className="flex gap-4">
                  {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="flex-1 px-6 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold transition flex items-center justify-center gap-2"
                    >
                      Take Quiz
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}

                  {currentLesson.sandboxTask && (
                    <button className="px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold transition border border-white/10 flex items-center gap-2">
                      <PlayCircle className="w-5 h-5" />
                      Try Sandbox
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
          {}
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

          {}
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
                      className={`px-4 py-3 rounded-xl font-semibold transition ${
                        action === a
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

        {}
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

        {}
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
                className={`p-6 rounded-xl text-center transition ${
                  badge.unlocked
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
    <div className="bg-black text-white min-h-screen">
      <Header />
      <LearningHero />
      <LessonSlides />
      <Sandbox />
      <ProgressTracker />
      <Footer />
    </div>
  );
}
