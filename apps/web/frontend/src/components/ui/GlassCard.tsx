import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    interactive?: boolean;
    glowColor?: 'cyan' | 'purple' | 'success' | 'error' | 'none';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    onClick?: () => void;
}

const glowStyles = {
    cyan: 'hover:shadow-glow-sm hover:border-neon-cyan/30',
    purple: 'hover:shadow-glow-purple hover:border-deep-purple/30',
    success: 'hover:shadow-glow-success hover:border-success/30',
    error: 'hover:shadow-glow-error hover:border-error/30',
    none: '',
};

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
};

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    interactive = false,
    glowColor = 'cyan',
    padding = 'md',
    onClick,
}) => {
    const baseStyles = `
    relative overflow-hidden rounded-2xl
    bg-lynq-card/80 backdrop-blur-xl
    border border-glass-border
    shadow-card
    transition-all duration-300 ease-smooth
  `;

    const interactiveStyles = interactive
        ? 'cursor-pointer hover:bg-lynq-card-hover/90 hover:border-glass-strong hover:scale-[1.01] hover:-translate-y-1'
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`
        ${baseStyles}
        ${interactiveStyles}
        ${glowStyles[glowColor]}
        ${paddingStyles[padding]}
        ${className}
      `}
            onClick={onClick}
            whileHover={interactive ? { scale: 1.01 } : undefined}
            whileTap={interactive ? { scale: 0.99 } : undefined}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
