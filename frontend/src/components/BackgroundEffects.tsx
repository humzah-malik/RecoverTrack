// src/components/BackgroundEffects.tsx
import { useEffect, useRef } from "react";
import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";

// Helper to turn "#RRGGBB" into 0xRRGGBB
const hexToNumber = (hex: string): number =>
  parseInt(hex.replace(/^#/, ""), 16);

const readVars = () => {
  const cs = getComputedStyle(document.documentElement);
  return {
    line:       cs.getPropertyValue("--vanta-line").trim(),
    dot:        cs.getPropertyValue("--vanta-dot").trim(),
    opacity:    parseFloat(cs.getPropertyValue("--vanta-opacity")) || 0.3,
    blend:      cs.getPropertyValue("--vanta-blend").trim() || "overlay",
    points:     parseFloat(cs.getPropertyValue("--vanta-points")) || 7,
    distance:   parseFloat(cs.getPropertyValue("--vanta-distance")) || 14,
    spacing:    parseFloat(cs.getPropertyValue("--vanta-spacing")) || 22,
  };
};

export default function BackgroundEffects() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vanta     = useRef<any>(null);

  useEffect(() => {
    if (!vantaRef.current) return;
    const vars = readVars();

    // Convert CSS var strings to numeric if they're hex
    const initialColor = vars.line.startsWith("#")
      ? hexToNumber(vars.line)
      : vars.line;
    const initialDot = vars.dot.startsWith("#")
      ? hexToNumber(vars.dot)
      : vars.dot;

    vanta.current = NET({
      el:              vantaRef.current,
      THREE,
      color:           initialColor,
      backgroundAlpha: 0,
      points:          vars.points,
      maxDistance:     vars.distance,
      spacing:         vars.spacing,
      showDots:        true,
      dotColor:        initialDot,
    });

    // apply css-driven layer style
    const applyLayerStyle = () => {
      const v = readVars();
      const newColor = v.line.startsWith("#") ? hexToNumber(v.line) : v.line;
      const newDot   = v.dot.startsWith("#")  ? hexToNumber(v.dot)  : v.dot;

      vanta.current?.setOptions({
        color:       newColor,
        points:      v.points,
        maxDistance: v.distance,
        spacing:     v.spacing,
        dotColor:    newDot,
      });

      const el = vantaRef.current!;
      el.style.opacity       = String(v.opacity);
      el.style.mixBlendMode  = v.blend;
    };

    applyLayerStyle();

    // watch for theme/class changes
    const mo = new MutationObserver(applyLayerStyle);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      mo.disconnect();
      vanta.current?.destroy();
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}