'use client';

import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

export function LoadingPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
            <div className="w-full h-full">
                <Spline scene="https://prod.spline.design/QXq5yiAIyNxJdTRB/scene.splinecode" />
            </div>

            {/* Optional loading text */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                        <motion.div
                            className="w-3 h-3 bg-cyan-400 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 0,
                            }}
                        />
                        <motion.div
                            className="w-3 h-3 bg-violet-400 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 0.2,
                            }}
                        />
                        <motion.div
                            className="w-3 h-3 bg-cyan-400 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.5, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 0.4,
                            }}
                        />
                    </div>
                    <p className="text-gray-400 text-sm">Loading LYNQ...</p>
                </div>
            </div>
        </motion.div>
    );
}
