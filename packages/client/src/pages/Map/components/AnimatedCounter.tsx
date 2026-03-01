/**
 * AnimatedCounter — Reusable animated number counter using framer-motion.
 * Smoothly interpolates between values with spring physics.
 */
import { useEffect, useRef } from 'react';
import { useSpring, useTransform, motion, type MotionValue } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  /** Format the number for display (default: toLocaleString) */
  format?: (n: number) => string;
  /** CSS class for the number */
  className?: string;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. " L") */
  suffix?: string;
  /** Spring stiffness (default: 80) */
  stiffness?: number;
  /** Spring damping (default: 20) */
  damping?: number;
}

function AnimatedCounterInner({
  value,
  format,
  className = '',
  prefix = '',
  suffix = '',
  stiffness = 80,
  damping = 20,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { stiffness, damping });
  const display = useTransform(spring, (v: number) => {
    const formatted = format ? format(Math.round(v)) : Math.round(v).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });
  const prevValue = useRef(0);

  useEffect(() => {
    // Only animate if value actually changed
    if (value !== prevValue.current) {
      spring.set(value);
      prevValue.current = value;
    }
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}

export default AnimatedCounterInner;

/** Hook version for custom use */
export function useAnimatedValue(
  value: number,
  opts: { stiffness?: number; damping?: number } = {},
): MotionValue<number> {
  const spring = useSpring(0, {
    stiffness: opts.stiffness ?? 80,
    damping: opts.damping ?? 20,
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return spring;
}
