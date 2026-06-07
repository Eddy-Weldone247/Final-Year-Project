import { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';

interface AnimatedCounterProps {
  value: number;
  /** Formatter for the displayed number (defaults to currency). */
  format?: (n: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Eases a number from its previous value to the new one on mount/change.
 * Runs on the JS thread (a few one-shot counters on load — negligible cost) so
 * the value can be formatted with the Hermes-safe `formatCurrency`.
 */
export function AnimatedCounter({
  value,
  format = formatCurrency,
  duration = 900,
  style,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      setDisplay(from + (value - from) * easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <Text style={style}>{format(display)}</Text>;
}
