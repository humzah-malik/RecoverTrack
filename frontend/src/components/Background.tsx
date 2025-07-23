// src/components/Background.tsx

import BackgroundGradient from "./BackgroundGradient";
import BackgroundGrid from "./BackgroundGrid";
import BackgroundNoise from "./BackgroundNoise";

type Variant = 'gradient' | 'noise' | 'grid';

export default function Background({ variant }: { variant: Variant }) {
  if (variant === 'noise') return <BackgroundNoise />;
  if (variant === 'grid') return <BackgroundGrid />;
  return <BackgroundGradient />;
}