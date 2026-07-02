import React from "react";
import { Composition } from "remotion";
import { ShieldPayVideo, TOTAL_DURATION } from "./ShieldPayVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShieldPay"
      component={ShieldPayVideo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
