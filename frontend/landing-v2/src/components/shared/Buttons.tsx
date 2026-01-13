import { ComponentProps, ReactNode } from 'react';
import { motion } from 'framer-motion';

type MotionButtonProps = Omit<ComponentProps<typeof motion.button>, 'ref'>;

interface ButtonProps extends MotionButtonProps {
	variant?: 'primary' | 'secondary' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	children: ReactNode;
}

export function Button({
	variant = 'primary',
	size = 'md',
	className = '',
	children,
	...props
}: ButtonProps) {
	const baseStyles = 'rounded-full font-semibold transition-all inline-flex items-center justify-center gap-2';

	const variants = {
		primary:
			'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg shadow-cyan-500/30',
		secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
		ghost: 'text-cyan-400 hover:text-cyan-300',
	} as const;

	const sizes = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg',
	} as const;

	return (
		<motion.button
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			{...props}
		>
			{children}
		</motion.button>
	);
}
