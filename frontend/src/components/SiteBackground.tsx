import { BackgroundGradient } from './BackgroundGradient';
import { BackgroundGrid } from './BackgroundGrid';
import { BackgroundNoise } from './BackgroundNoise';

export default function SiteBackground() {
    return (
      <div className="pointer-events-none fixed inset-0 -z-40">
        <BackgroundGradient />
        <BackgroundGrid />
        {/* <BackgroundNoise /> */}
      </div>
    );
  }  