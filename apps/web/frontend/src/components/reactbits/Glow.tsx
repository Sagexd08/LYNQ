import { motion } from 'framer-motion';

interface GlowProps {
  children: React.ReactNode;
  className?: string;
  color?: 'blue' | 'purple' | 'cyan' | 'green' | 'pink' | 'orange';
  intensity?: 'light' | 'medium' | 'strong';
}

const Glow: React.FC<GlowProps> = ({
  children,
  className = '',
  color = 'cyan',
  intensity = 'medium',
}) => {
  const colorMap = {
    blue: 'shadow-blue-500',
    purple: 'shadow-purple-500',
    cyan: 'shadow-cyan-500',
    green: 'shadow-green-500',
    pink: 'shadow-pink-500',
    orange: 'shadow-orange-500',
  };

  const intensityMap = {
    light: 'shadow-lg',
    medium: 'shadow-2xl',
    strong: 'shadow-[0_0_50px_rgba(0,0,0,0.5)]',
  };

  return (
    <motion.div
      className={`${colorMap[color]} ${intensityMap[intensity]} ${className}`}
      animate={{
        boxShadow: [
          `0 0 ${intensity === 'light' ? 20 : intensity === 'medium' ? 30 : 50}px rgba(0,0,0,0)`,
          `0 0 ${intensity === 'light' ? 30 : intensity === 'medium' ? 40 : 60}px rgba(0,0,0,0.3)`,
          `0 0 ${intensity === 'light' ? 20 : intensity === 'medium' ? 30 : 50}px rgba(0,0,0,0)`,
        ],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default Glow;
