import React from "react";
import { Composition } from "remotion";
import { SpexlyDemo } from "./SpexlyDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SpexlyDemo"
      component={SpexlyDemo}
      durationInFrames={1350}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
