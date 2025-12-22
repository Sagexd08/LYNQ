import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { contractService } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Calculator } from 'lucide-react';
import { loanApi } from '../services/api/loans';

const CreateLoanPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        amount: '',
        collateral: '',
        duration: '30', // days
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.collateral) return;

        setIsSubmitting(true);
        try {
            // Use CollateralToken (MNT) for collateral
            const collateralToken = CONTRACT_ADDRESSES.mantleSepolia.CollateralToken;

            const { txHash, loanId } = await contractService.createLoan(
                formData.amount,
                formData.collateral,
                collateralToken
            );

            // Sync with backend
            try {
                await loanApi.create({
                    amount: formData.amount,
                    collateralAmount: formData.collateral,
                    collateralTokenAddress: collateralToken,
                    durationDays: parseInt(formData.duration),
                    chain: 'mantleSepolia',
                    transactionHash: txHash,
                    onChainId: loanId || undefined
                });
            } catch (err) {
                console.error("Backend sync failed:", err);
                // Don't block UI flow, but maybe warn? User sees loan on-chain anyway.
            }

            navigate('/loans');
        } catch (error) {
            console.error('Failed to create loan:', error);
            // Toast is handled in contractService
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateHealthFactor = () => {
        if (!formData.amount || !formData.collateral) return 0;
        const loanValue = parseFloat(formData.amount); // Assume 1 USDC = $1
        const collateralValue = parseFloat(formData.collateral) * 2000; // Mock ETH price $2000
        if (loanValue === 0) return 0;
        return collateralValue / loanValue;
    };

    const healthFactor = calculateHealthFactor();

    return (
        <div className="min-h-screen bg-lynq-dark">
            <div className="fixed inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

            <div className="relative z-10 page-container max-w-2xl mx-auto pt-20">
                <Button
                    variant="ghost"
                    className="mb-6 flex items-center gap-2"
                    onClick={() => navigate('/loans')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Loans
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <GlassCard padding="lg">
                        <h1 className="text-2xl font-bold font-heading text-white mb-6">Request New Loan</h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Borrow Amount (USDC)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                        className="w-full bg-glass-strong border border-glass-border rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="5000"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                                        USDC
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Collateral Amount (MNT)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.collateral}
                                        onChange={(e) => setFormData(p => ({ ...p, collateral: e.target.value }))}
                                        className="w-full bg-glass-strong border border-glass-border rounded-xl px-4 py-3 text-white focus:border-neon-cyan outline-none"
                                        placeholder="100.0"
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                                        MNT
                                    </div>
                                </div>
                            </div>

                            {/* Health Factor Preview */}
                            <div className="p-4 rounded-xl bg-glass-white border border-glass-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400 flex items-center gap-2">
                                        <Calculator className="w-4 h-4" />
                                        Estimated Health Factor
                                    </span>
                                    <span className={`font-bold ${healthFactor >= 1.5 ? 'text-success' : healthFactor >= 1.2 ? 'text-warning' : 'text-error'}`}>
                                        {healthFactor.toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${healthFactor >= 1.5 ? 'bg-success' : 'bg-warning'}`}
                                        style={{ width: `${Math.min(healthFactor * 30, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Maintain a health factor above 1.5 to avoid liquidation.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting || !formData.amount || !formData.collateral}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="loading-spinner w-4 h-4" />
                                        Processing Transaction...
                                    </span>
                                ) : (
                                    'Request Loan'
                                )}
                            </Button>
                        </form>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};

export default CreateLoanPage;
