import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import "./fonts";
import { inter } from "./fonts";

import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Reveal } from "./scenes/Scene3Reveal";
import { SceneProduct } from "./scenes/SceneProduct";
import { Scene4ZK } from "./scenes/Scene4ZK";
import { ScenePayrollProof } from "./scenes/ScenePayrollProof";
import { SceneOnChain } from "./scenes/SceneOnChain";
import { Scene5Real } from "./scenes/Scene5Real";
import { Scene6Disclosure } from "./scenes/Scene6Disclosure";
import { Scene7Portals } from "./scenes/Scene7Portals";
import { Scene8Close } from "./scenes/Scene8Close";

// Scene durations in frames (30fps). Tuned so each beat is legible.
export const SCENE_DURATIONS = {
  hook: 165, // 5.5s
  problem: 120, // 4.0s
  reveal: 135, // 4.5s
  product: 240, // 8.0s — show the product (masked amounts + verified)
  zk: 240, // 8.0s
  payroll: 210, // 7.0s — the innovation: Proof-of-Payroll
  onchain: 180, // 6.0s — real on-chain verification (contract + tx)
  real: 195, // 6.5s
  disclosure: 210, // 7.0s
  portals: 165, // 5.5s
  close: 180, // 6.0s
} as const;

const TRANSITION = 18; // 0.6s crossfade

// Total = sum(durations) - (scenes - 1) crossfades.
export const TOTAL_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  (Object.keys(SCENE_DURATIONS).length - 1) * TRANSITION;

const cross = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
);

export const ShieldPayVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: inter }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.problem}>
          <Scene2Problem />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.reveal}>
          <Scene3Reveal />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.product}>
          <SceneProduct />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.zk}>
          <Scene4ZK />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.payroll}>
          <ScenePayrollProof />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.onchain}>
          <SceneOnChain />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.real}>
          <Scene5Real />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.disclosure}>
          <Scene6Disclosure />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.portals}>
          <Scene7Portals />
        </TransitionSeries.Sequence>
        {cross}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.close}>
          <Scene8Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
