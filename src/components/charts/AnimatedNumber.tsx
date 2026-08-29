"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/cn";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatValue?: (v: number) => string;
  className?: string;
}

/** Count-up number — animates from its previous displayed value to `value`
 * whenever it changes (including the initial mount-from-zero), matching the
 * animated center total in PieChart. */
export function AnimatedNumber({
  value,
  duration = 0.7,
  formatValue = (v) => String(Math.round(v)),
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    const from = mounted.current ? motionValue.get() : 0;
    mounted.current = true;
    const controls = animate(from, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => motionValue.set(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  useMotionValueEvent(motionValue, "change", (v) => setDisplay(v));

  return <span className={cn("tabular-nums", className)}>{formatValue(display)}</span>;
}
