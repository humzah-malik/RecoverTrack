// src/components/aceternity/WavyBackground.tsx
import { motion, useMotionValue, useTransform, animate } from "framer-motion"; // <-- fix
import { useEffect } from "react";
import clsx from "clsx";

type Props = { speed?: number; blur?: number; className?: string };

export function WavyBackground({ speed = 0.4, blur = 12, className }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const cx = animate(x, 100, {
      duration: 20 / speed,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    });
    const cy = animate(y, 100, {
      duration: 26 / speed,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    });
    return () => { cx.stop(); cy.stop(); };
  }, [x, y, speed]);

  const backgroundPosition = useTransform([x, y], ([vx, vy]) => `${vx}% ${vy}%`);

  return (
    <motion.div
      style={{ backgroundPosition, filter: `blur(${blur}px)` }}
      className={clsx("w-full h-full bg-wavy-light dark:bg-wavy-dark", className)}
    />
  );
}
