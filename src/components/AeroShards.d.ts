import React from 'react';

export type AeroPlacement = 'right' | 'left' | 'center' | 'full';
export type AeroMaterial = 'pearl' | 'chrome' | 'satin';
export type AeroDetail = 'bold' | 'balanced' | 'fine';
export type AeroInteraction = 'none' | 'repel' | 'attract';
export type AeroEffect = 'none' | 'dither' | 'ascii';
export type AeroFlow = 'stream' | 'vortex' | 'ribbon';

export interface AeroShardsProps {
  backgroundColor?: string;
  shardColor?: string;
  accentColor?: string;
  placement?: AeroPlacement;
  flow?: AeroFlow;
  rippleIntensity?: number;
  holdToGather?: boolean;
  material?: AeroMaterial;
  detail?: AeroDetail;
  effect?: AeroEffect;
  scale?: number;
  spread?: number;
  depth?: number;
  speed?: number;
  spin?: number;
  interaction?: AeroInteraction;
  density?: number;
  shardSize?: number;
  stretch?: number;
  turbulence?: number;
  glow?: number;
  edgeSoftness?: number;
  bloom?: number;
  grain?: number;
  chromaticAberration?: number;
  transitionDuration?: number;
  interactionRadius?: number;
  interactionStrength?: number;
  paused?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

export default function AeroShards(props: AeroShardsProps): React.JSX.Element;
