// src/components/BackgroundNoise.tsx
import { useEffect, useRef } from 'react';

export function BackgroundNoise() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d', { alpha: true })!;
    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);

    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    // Simple random noise (cheap). Swap with simplex if you want smoother.
    const draw = () => {
      const imageData = ctx.createImageData(w, h);
      const buf = imageData.data;
      for (let i = 0; i < buf.length; i += 4) {
        const v = Math.random() * 20; // 0–20 white
        buf[i] = buf[i+1] = buf[i+2] = v;
        buf[i+3] = 14; // alpha (0–255) => ~0.055
      }
      ctx.putImageData(imageData, 0, 0);
    };

    let frameId: number;
    const loop = () => {
      draw();
      frameId = setTimeout(loop, 50) as unknown as number; // ~20 fps
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(frameId);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
    />
  );
}