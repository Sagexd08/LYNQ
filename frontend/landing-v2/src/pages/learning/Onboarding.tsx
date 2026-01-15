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
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-mono selection:bg-green-500/30">
            <Header />

            <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
                {/* Infrastructure Background */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.5)_50%,transparent_100%)] bg-[size:100%_4px] opacity-10" />
                </div>

                <div className="max-w-2xl w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0A0A0A] border border-white/10 p-8 md:p-12 rounded-sm"
                    >
                        {score === null ? (
                            <>
                                <div className="mb-8 border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                                        <span className="text-xs font-bold text-green-500 uppercase tracking-widest">System Check</span>
                                    </div>
                                    <h1 className="text-2xl font-medium text-white mb-2 font-sans tracking-tight">
                                        Competency Verification
                                    </h1>
                                    <p className="text-sm text-gray-400 font-sans">
                                        Protocol access requires verifying baseline DeFi knowledge.
                                    </p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">
                                        <span>Sequence {currentStep + 1} / {QUESTIONS.length}</span>
                                        <span>{Math.round(((currentStep) / QUESTIONS.length) * 100)}% Verified</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-300 ease-out"
                                            style={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h2 className="text-lg font-medium text-white mb-6 font-sans">
                                        {QUESTIONS[currentStep].question}
                                    </h2>
                                    <div className="space-y-2">
                                        {QUESTIONS[currentStep].options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(idx)}
                                                className="w-full p-4 text-left bg-[#0A0A0A] hover:bg-white/5 border border-white/10 hover:border-white/30 transition-all group flex items-center justify-between rounded-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-gray-500 font-mono">[{String.fromCharCode(65 + idx)}]</span>
                                                    <span className="text-sm text-gray-300 group-hover:text-white font-sans">{option}</span>
                                                </div>
                                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-green-500 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 border border-white/10 bg-white/5 mb-6 rounded-sm">
                                    {recommendation?.type === 'pro' ? (
                                        <ShieldCheck className="w-8 h-8 text-green-500" />
                                    ) : (
                                        <BookOpen className="w-8 h-8 text-yellow-500" />
                                    )}
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">
                                    {recommendation?.title}
                                </h2>
                                <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto font-sans leading-relaxed">
                                    {recommendation?.message}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={recommendation?.action}
                                        className={`px-8 py-3 font-bold uppercase tracking-wider transition-all rounded-sm text-xs ${recommendation?.type === 'pro'
                                            ? 'bg-green-500 hover:bg-green-400 text-black'
                                            : 'bg-white hover:bg-gray-200 text-black'
                                            }`}
                                    >
                                        {recommendation?.cta}
                                    </button>

                                    {recommendation?.type === 'learner' && (
                                        <button
                                            onClick={() => navigate('/app')}
                                            className="px-6 py-3 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                                        >
                                            Override & Enter
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
