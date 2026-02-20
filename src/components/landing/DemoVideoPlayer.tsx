'use client';

import { Player } from '@remotion/player';
import { SpexlyDemo } from '../../../remotion/SpexlyDemo';

export function DemoVideoPlayer() {
  return (
    <Player
      component={SpexlyDemo}
      compositionWidth={1920}
      compositionHeight={1080}
      durationInFrames={1350}
      fps={30}
      autoPlay
      controls
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    />
  );
}
