import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { loanApi } from '../../services/api/loanApi';
import { contractService } from '../../services/contractService';
import toast from 'react-hot-toast';

interface RefinanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    loanId: string;
    currentRate: number;
}

export const RefinanceModal: React.FC<RefinanceModalProps> = ({ isOpen, onClose, loanId, currentRate }) => {
    const [step, setStep] = useState<'loading' | 'offer' | 'signing' | 'success' | 'error'>('loading');
    const [offer, setOffer] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen && loanId) {
            fetchOffer();
        }
    }, [isOpen, loanId]);

    const fetchOffer = async () => {
        setStep('loading');
        setErrorMsg('');
        try {
            const res = await loanApi.refinance(loanId);
            if (res.data && res.data.success) {
                setOffer(res.data);
                setStep('offer');
            } else {
                throw new Error('No offer available');
            }
        } catch (e: any) {
            const msg = e.response?.data?.message || e.message || 'Failed to fetch offer';
            setErrorMsg(msg);
            setStep('error');
        }
    };

    const handleConfirm = async () => {
        if (!offer) return;
        setStep('signing');
        try {
            const { proposal, signature } = offer;

            await contractService.refinanceLoan(
                proposal.loanId.toString(),
                {
                    newInterestRate: proposal.newInterestRate,
                    newDuration: proposal.newDuration,
                    timestamp: proposal.timestamp,
                    nonce: proposal.nonce,
                    signature: signature
                }
            );

            setStep('success');
            toast.success("Refinance successful!");
        } catch (e: any) {
            console.error(e);
            setErrorMsg("Transaction failed or rejected");
            setStep('error');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md"
                >
                    <GlassCard className="relative p-6">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <X size={20} />
                        </button>

                        <div className="mb-6 flex items-center gap-2">
                            <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400">
                                <ShieldCheck size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Refinance Loan</h2>
                        </div>

                        {step === 'loading' && (
                            <div className="py-8 text-center text-white/70">
                                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                Checking eligibility...
                            </div>
                        )}

                        {step === 'error' && (
                            <div className="py-6 text-center">
                                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                                <p className="text-red-300 mb-4">{errorMsg}</p>
                                <Button onClick={onClose} variant="secondary">Close</Button>
                            </div>
                        )}

                        {step === 'offer' && offer && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                    <div className="text-center w-full">
                                        <div className="text-sm text-white/50 mb-1">Current Rate</div>
                                        <div className="text-xl font-mono text-red-300">{currentRate}%</div>
                                    </div>
                                    <ArrowRight size={24} className="text-white/20 mx-4" />
                                    <div className="text-center w-full">
                                        <div className="text-sm text-cyan-400 mb-1">New Rate</div>
                                        <div className="text-3xl font-bold text-cyan-400">{offer.betterTerms.newRate}%</div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                                        You save {offer.betterTerms.improvement} on interest
                                    </span>
                                </div>

                                <Button onClick={handleConfirm} className="w-full">
                                    Accept Offer & Sign
                                </Button>
                            </div>
                        )}

                        {step === 'signing' && (
                            <div className="py-8 text-center text-white/70">
                                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                Please confirm transaction in wallet...
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="py-6 text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Loan Refinanced!</h3>
                                <p className="text-white/60 mb-6">Your new interest rate is active.</p>
                                <Button onClick={onClose} className="w-full">Done</Button>
                            </div>
                        )}

                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
