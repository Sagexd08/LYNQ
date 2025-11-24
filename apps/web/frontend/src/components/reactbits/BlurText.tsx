import { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Variants['hidden'];
  animationTo?: Variants['visible'];
  easing?: string;
  onAnimationComplete?: () => void;
}

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 0.1,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = 'easeOut',
  onAnimationComplete,
}) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: threshold, margin: rootMargin as any, once: true });

  const defaultFrom =
    direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -50 }
      : { filter: 'blur(10px)', opacity: 0, y: 50 };

  const defaultTo = {
    filter: 'blur(0px)',
    opacity: 1,
    y: 0,
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: animationFrom || defaultFrom,
    visible: {
      ...((animationTo || defaultTo) as any),
      transition: {
        duration: 0.5,
        ease: easing,
      },
    },
  };

  return (
    <motion.p
      ref={ref}
      className={`blur-text ${className} flex flex-wrap`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      onAnimationComplete={onAnimationComplete}
    >
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className="inline-block will-change-[transform,filter,opacity]"
        >
          {element === ' ' ? '\u00A0' : element}
          {animateBy === 'words' && index < elements.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.p>
  );
};

export default BlurText;
