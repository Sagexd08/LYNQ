import React from 'react';
import { motion } from 'framer-motion';

// Omit conflicting event handlers that have different signatures in Framer Motion
type MotionConflictingProps = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictingProps> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    glow?: boolean;
}

const variants = {
    primary: `
    relative overflow-hidden
    bg-gradient-primary text-white font-semibold
    shadow-glow-sm
    hover:shadow-glow-md
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
    secondary: `
    bg-glass-white backdrop-blur-md
    border border-glass-border text-white font-semibold
    hover:bg-glass-strong hover:border-neon-cyan/50
  `,
    ghost: `
    text-gray-300 font-medium
    hover:text-white hover:bg-glass-white
  `,
    danger: `
    bg-gradient-danger text-white font-semibold
    shadow-glow-error
    hover:shadow-lg
  `,
};

const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg gap-1.5',
    md: 'px-6 py-3 text-base rounded-xl gap-2',
    lg: 'px-8 py-4 text-lg rounded-xl gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    glow = false,
    className = '',
    disabled,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
        inline-flex items-center justify-center
        transition-all duration-300 ease-spring
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="loading-spinner w-5 h-5" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
                    {children}
                    {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
                </>
            )}
        </motion.button>
    );
};

export default Button;
