import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

const QUESTIONS = [
    {
        question: "What is Collateral in DeFi?",
        options: [
            "Assets borrowed from a protocol",
            "Assets deposited to secure a loan",
            "The interest rate paid on loans",
            "A type of stablecoin"
        ],
        correctIndex: 1
    },
    {
        question: "What happens if your Health Factor drops below 1.0?",
        options: [
            "Nothing, it's just a warning",
            "Your collateral increases in value",
            "Your position stays open indefinitely",
            "Your position may be liquidated"
        ],
        correctIndex: 3
    },
    {
        question: "Which of these reduces liquidation risk?",
        options: [
            "Borrowing more against same collateral",
            "Repaying part of the loan",
            "Withdrawing collateral",
            "Ignoring market volatility"
        ],
        correctIndex: 1
    }
];

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [score, setScore] = useState<number | null>(null);

    const handleAnswer = (index: number) => {
        const newAnswers = [...answers, index];
        setAnswers(newAnswers);

        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Calculate score
            let correct = 0;
            newAnswers.forEach((ans, idx) => {
                if (ans === QUESTIONS[idx].correctIndex) correct++;
            });
            setScore(correct);
        }
    };

    const getRecommendation = () => {
        if (score === null) return null;
        if (score === QUESTIONS.length) {
            return {
                type: 'pro',
                title: 'Expert Level',
                message: 'You have a solid understanding of DeFi mechanisms. You are ready to dive in!',
                action: () => navigate('/app'),
                cta: 'Launch App'
            };
        } else {
            return {
                type: 'learner',
                title: 'Learning Recommended',
                message: 'We recommend going through our interactive learning modules to master the basics and keep your funds safe.',
                action: () => navigate('/learning'),
                cta: 'Start Learning'
            };
        }
    };

    const recommendation = getRecommendation();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Header />

            <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen" />
                </div>

                <div className="max-w-2xl w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#111114] border border-[#1f1f25] p-8 md:p-12 rounded-3xl shadow-2xl backdrop-blur-xl"
                    >
                        {score === null ? (
                            <>
                                <div className="mb-8 text-center">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
                                        DeFi Knowledge Check
                                    </h1>
                                    <p className="text-gray-400">
                                        Let's assess your experience level to personalize your onboarding.
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                                        <span>Question {currentStep + 1} of {QUESTIONS.length}</span>
                                        <span>{Math.round(((currentStep) / QUESTIONS.length) * 100)}% Complete</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
                                            style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-white mb-6">
                                        {QUESTIONS[currentStep].question}
                                    </h2>
                                    <div className="space-y-3">
                                        {QUESTIONS[currentStep].options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                className="w-full p-4 rounded-xl text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 transition-all group flex items-center justify-between"
                                            >
                                                <span className="text-gray-300 group-hover:text-white">{option}</span>
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-cyan-400 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 mb-6">
                                    {recommendation?.type === 'pro' ? (
                                        <ShieldCheck className="w-10 h-10 text-cyan-400" />
                                    ) : (
                                        <BookOpen className="w-10 h-10 text-violet-400" />
                                    )}
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-4">
                                    {recommendation?.title}
                                </h2>
                                <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
                                    {recommendation?.message}
                                </p>

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={recommendation?.action}
                                        className={`px-8 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 ${recommendation?.type === 'pro'
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                            : 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                                            }`}
                                    >
                                        {recommendation?.cta}
                                    </button>

                                    {recommendation?.type === 'learner' && (
                                        <button
                                            onClick={() => navigate('/app')}
                                            className="px-6 py-4 rounded-full text-gray-400 hover:text-white font-medium"
                                        >
                                            Skip to App
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
