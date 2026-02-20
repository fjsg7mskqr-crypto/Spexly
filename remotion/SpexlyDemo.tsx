import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { DescribeIdeaScene } from "./scenes/DescribeIdeaScene";
import { BlueprintScene } from "./scenes/BlueprintScene";
import { FeatureDepthScene } from "./scenes/FeatureDepthScene";
import { BuildClarityScene } from "./scenes/BuildClarityScene";
import { CtaScene } from "./scenes/CtaScene";

export const SpexlyDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <Series>
        <Series.Sequence durationInFrames={150}>
          <IntroScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <DescribeIdeaScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <BlueprintScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <FeatureDepthScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <BuildClarityScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <CtaScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
