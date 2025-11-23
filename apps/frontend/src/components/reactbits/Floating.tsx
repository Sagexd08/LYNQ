import { motion } from 'framer-motion';

interface FloatingProps {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
}

const Floating: React.FC<FloatingProps> = ({
  children,
  className = '',
  distance = 10,
  duration = 4,
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default Floating;
