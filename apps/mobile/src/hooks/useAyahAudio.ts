import {useCallback, useEffect, useRef, useState} from 'react';
import TrackPlayer, {Event, State, useTrackPlayerEvents} from 'react-native-track-player';
import {playUrl, pause as audioPause, stop as audioStop, setupPlayer} from '@/lib/audio';

interface Result {
  isPlaying: boolean;
  isLoading: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  error: string | null;
}

let activeUrl: string | null = null;

export function useAyahAudio(url: string): Result {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ownsActiveRef = useRef(false);

  useEffect(() => {
    void setupPlayer();
  }, []);

  useTrackPlayerEvents([Event.PlaybackState], event => {
    if (!ownsActiveRef.current) return;
    if (event.type !== Event.PlaybackState) return;
    const state = event.state;
    setIsLoading(state === State.Loading || state === State.Buffering);
    setIsPlaying(state === State.Playing);
  });

  const play = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      activeUrl = url;
      ownsActiveRef.current = true;
      await playUrl(url);
    } catch (e) {
      setError(String(e ?? 'Failed to play'));
      setIsLoading(false);
    }
  }, [url]);

  const pause = useCallback(async () => {
    if (!ownsActiveRef.current) return;
    try {
      await audioPause();
    } catch (e) {
      setError(String(e ?? 'Failed to pause'));
    }
  }, []);

  const stop = useCallback(async () => {
    if (!ownsActiveRef.current) return;
    try {
      await audioStop();
      if (activeUrl === url) activeUrl = null;
      ownsActiveRef.current = false;
      setIsPlaying(false);
    } catch (e) {
      setError(String(e ?? 'Failed to stop'));
    }
  }, [url]);

  useEffect(() => {
    return () => {
      if (ownsActiveRef.current && activeUrl !== url) {
        ownsActiveRef.current = false;
      }
    };
  }, [url]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const state = await TrackPlayer.getPlaybackState().catch(() => null);
      if (cancelled) return;
      if (!state) return;
      if (activeUrl !== url) {
        setIsPlaying(false);
        return;
      }
      setIsPlaying(state.state === State.Playing);
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return {isPlaying, isLoading, play, pause, stop, error};
}
