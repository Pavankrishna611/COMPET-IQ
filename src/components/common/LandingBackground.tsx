'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const AeroShards = dynamic(() => import('@/components/AeroShards'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#e0dce8]" />,
});

export interface LandingBackgroundProps {
  className?: string;
  interactive?: boolean;
}

export function LandingBackground({
  className,
  interactive = true,
}: LandingBackgroundProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full z-0',
        interactive ? 'pointer-events-auto' : 'pointer-events-none',
        className
      )}
    >
      <AeroShards
        backgroundColor="#e0dce8"
        shardColor="#123B66"
        accentColor="#0B837F"
        placement="full"
        material="pearl"
        detail="balanced"
        effect="none"
        flow="stream"
        rippleIntensity={1}
        holdToGather
        scale={1}
        spread={1}
        depth={1}
        speed={1}
        spin={1}
        interaction="repel"
        density={1.5}
        shardSize={1.1}
        stretch={1}
        turbulence={1}
        glow={1}
        edgeSoftness={2}
        bloom={0.5}
        grain={0.05}
        chromaticAberration={0.0075}
        transitionDuration={1}
        interactionRadius={1.5}
        interactionStrength={0.5}
        paused={false}
      />
    </div>
  );
}

export default LandingBackground;
