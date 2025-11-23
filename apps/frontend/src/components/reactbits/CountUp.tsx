import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  onEnd?: () => void;
}

const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  decimals = 0,
  suffix = "",
  prefix = "",
  onEnd,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });
  
  useEffect(() => {
    if (isInView && startWhen) {
      const node = ref.current;
      if (!node) return;

      const controls = animate(from, to, {
        duration: duration,
        delay: delay,
        ease: "easeOut",
        onUpdate: (value) => {
          node.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator) + suffix;
        },
        onComplete: onEnd,
      });

      return () => controls.stop();
    }
  }, [isInView, startWhen, from, to, delay, duration, separator, decimals, suffix, prefix, onEnd]);

  return <span ref={ref} className={className}>{prefix + from.toFixed(decimals) + suffix}</span>;
};

export default CountUp;
