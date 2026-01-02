import React from 'react';
import { motion } from 'framer-motion';


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
    bg-white text-black font-bold
    hover:bg-gray-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
    secondary: `
    bg-[#0F1115] backdrop-blur-md
    border border-white/10 text-white font-bold
    hover:bg-white/5 hover:border-white/20
  `,
    ghost: `
    text-gray-400 font-medium
    hover:text-white hover:bg-white/5
  `,
    danger: `
    bg-critical-red text-white font-bold
    hover:brightness-110
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
