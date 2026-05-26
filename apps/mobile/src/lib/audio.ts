import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from 'react-native-track-player';

let setupPromise: Promise<void> | null = null;

export async function setupPlayer(): Promise<void> {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });
    } catch (e) {
      const msg = String(e ?? '');
      if (!msg.includes('already been initialized')) {
        setupPromise = null;
        throw e;
      }
    }
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause],
    });
  })();
  return setupPromise;
}

export async function playUrl(url: string, title = 'Ayah', artist = 'Mishary Alafasy'): Promise<void> {
  await setupPlayer();
  await TrackPlayer.reset();
  await TrackPlayer.add({id: url, url, title, artist});
  await TrackPlayer.play();
}

export async function pause(): Promise<void> {
  await TrackPlayer.pause();
}

export async function stop(): Promise<void> {
  await TrackPlayer.stop();
  await TrackPlayer.reset();
}
