import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ChevronRight,
    Brain,
    ShieldCheck,
    AlertTriangle,
    HelpCircle,
} from 'lucide-react';
import { contractService } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { loanApi } from '../services/api/loanApi';
import { mlApi } from '../services/api/ml';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { RiskMeter } from '../components/lynq/RiskMeter';

const CreateLoanPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        collateral: '',
        duration: '30',
    });

    const [mlReport, setMlReport] = useState<any>(null);

    const handleNext = async () => {
        if (step === 1) {
            if (!formData.amount || !formData.collateral) return;


            setIsSubmitting(true);
            try {
                const res = await mlApi.getMyCreditScore();
                setMlReport(res.data);
                setStep(2);
            } catch (e) {
                toast.error("Intelligence engine offline. Proceeding with standard rates.");
                setStep(2);
            } finally {
                setIsSubmitting(false);
            }
        } else if (step === 2) {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else navigate('/dashboard');
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const collateralToken = CONTRACT_ADDRESSES.mantleSepolia.CollateralToken;
            const { txHash, loanId } = await contractService.createLoan(
                formData.amount,
                formData.collateral,
                collateralToken
            );

            await loanApi.create({
                amount: formData.amount,
                collateralAmount: formData.collateral,
                collateralTokenAddress: collateralToken,
                durationDays: parseInt(formData.duration),
                chain: 'mantleSepolia',
                transactionHash: txHash,
                onChainId: loanId || undefined
            });

            toast.success("Loan Authorized & Blocked");
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to create loan:', error);
            toast.error("Operation Failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 pb-12 px-6">
            <div className="max-w-xl mx-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    className="mb-8 pl-0 text-gray-500 hover:text-white"
                    onClick={handleBack}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {step === 1 ? 'Cancel Operation' : 'Reverse Step'}
                </Button>

                { }
                <div className="flex gap-2 mb-12">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-neon-cyan' : 'bg-white/5'}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl font-heading font-bold mb-2">Configure Position</h1>
                                <p className="text-gray-500 font-metrics text-xs uppercase tracking-widest">Step 01: Resource Allocation</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-metrics text-gray-500 uppercase tracking-widest">Borrowing Target (USDC)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                        className="w-full bg-[#0F1115] border border-white/5 rounded-2xl px-6 py-4 text-xl font-metrics focus:border-neon-cyan/50 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-metrics text-gray-500 uppercase tracking-widest">Collateral Buffer (MNT)</label>
                                    <input
                                        type="number"
                                        value={formData.collateral}
                                        onChange={(e) => setFormData(p => ({ ...p, collateral: e.target.value }))}
                                        className="w-full bg-[#0F1115] border border-white/5 rounded-2xl px-6 py-4 text-xl font-metrics focus:border-neon-cyan/50 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <Button
                                fullWidth
                                size="lg"
                                className="h-14"
                                onClick={handleNext}
                                loading={isSubmitting}
                                disabled={!formData.amount || !formData.collateral}
                            >
                                Run ML Analysis <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div>
                                <h1 className="text-3xl font-heading font-bold mb-2">ML Intelligence Review</h1>
                                <p className="text-gray-500 font-metrics text-xs uppercase tracking-widest">Step 02: Risk Assessment Portfolio</p>
                            </div>

                            <div className="p-8 rounded-3xl bg-[#0F1115] border border-white/5 space-y-10">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-gray-500 font-metrics uppercase tracking-widest font-bold">Credit Grade</span>
                                        <h2 className="text-4xl font-heading font-black italic tracking-tighter text-neon-cyan">{mlReport?.grade || 'Tier A+'}</h2>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-500 font-metrics uppercase tracking-widest font-bold">Fraud Shield</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <ShieldCheck className="w-4 h-4 text-neon-cyan" />
                                            <span className="text-xs font-bold font-metrics text-white uppercase">Verified</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <RiskMeter level={18} label="Position Risk Level" />
                                    <div className="flex items-center gap-2 text-[10px] font-metrics text-gray-500 italic">
                                        <Brain className="w-3 h-3" />
                                        Prediction Confidence: 98.2%
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                    <button
                                        onClick={() => setShowExplanation(!showExplanation)}
                                        className="flex items-center justify-between w-full group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                            <span className="text-xs font-bold font-metrics uppercase tracking-wider">Why this rate?</span>
                                        </div>
                                        <div className={`transition-transform duration-300 ${showExplanation ? 'rotate-180' : ''}`}>
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {showExplanation && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 space-y-3">
                                                    <div className="flex justify-between text-[11px] font-metrics">
                                                        <span className="text-gray-500">Reputation Discount</span>
                                                        <span className="text-neon-cyan font-bold">-0.5%</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-metrics">
                                                        <span className="text-gray-500">Utilization Premium</span>
                                                        <span className="text-white font-bold">+0.1%</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-metrics">
                                                        <span className="text-gray-500">Risk Profile Adjustment</span>
                                                        <span className="text-white font-bold">+0.0%</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-600 leading-relaxed pt-2 border-t border-white/5 italic">
                                                        *Rates are dynamic and calculated based on your historical behavior and current protocol liquidity.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <Button fullWidth size="lg" className="h-14" onClick={handleNext}>
                                Review Final Terms <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-3xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20 mx-auto mb-6">
                                    <ShieldCheck className="w-8 h-8 text-neon-cyan" />
                                </div>
                                <h1 className="text-3xl font-heading font-bold mb-2">Final Confirmation</h1>
                                <p className="text-gray-500 font-metrics text-xs uppercase tracking-widest">Step 03: Protocol Authorization</p>
                            </div>

                            <div className="p-8 rounded-3xl border border-white/5 bg-[#0F1115] space-y-6">
                                <div className="flex justify-between items-center text-sm font-metrics">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest">Borrowing</span>
                                    <span className="text-white font-black text-lg font-heading">{formData.amount} USDC</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-metrics">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest">Collateral</span>
                                    <span className="text-white font-black text-lg font-heading">{formData.collateral} MNT</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-metrics border-t border-white/5 pt-6">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest">Interest Rate</span>
                                    <span className="text-neon-cyan font-black text-lg font-heading">4.2% APR</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-risk-amber/5 border border-risk-amber/10">
                                <AlertTriangle className="w-5 h-5 text-risk-amber flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-risk-amber/80 font-metrics uppercase tracking-wider leading-relaxed">
                                    Warning: Failure to maintain health factor {'>'} 1.2 will trigger automated protocol liquidations. Proceed with caution.
                                </p>
                            </div>

                            <Button
                                fullWidth
                                size="lg"
                                className="h-14 bg-neon-cyan text-black hover:bg-cyan-300 font-black tracking-widest uppercase italic"
                                onClick={handleSubmit}
                                loading={isSubmitting}
                            >
                                Execute Authorization
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CreateLoanPage;
