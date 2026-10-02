import React, { useEffect, useState } from 'react';
import { Text, View, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { randomUUID } from 'expo-crypto';
import { Button, s } from './ui';
import { t } from '@suraksha/shared';
import { withDeviceInteraction } from '../lib/device-interaction';
import type { EvidenceFile } from '../providers/media';
export function AudioCapture({ onCaptured }: { onCaptured: (file: EvidenceFile) => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.isFinished && status.url && !status.hasError)
      onCaptured({ uri: status.url, name: 'Recorded-audio.m4a', mimeType: 'audio/mp4' });
  });
  const state = useAudioRecorderState(recorder);
  return (
    <View>
      <Text style={s.muted}>
        {state.isRecording
          ? `${Math.round(state.durationMillis / 1000)}s · ${t('Recording')}`
          : t('Record an audio account of what happened')}
      </Text>
      <Button
        title={state.isRecording ? t('Stop recording') : t('Record audio')}
        tone="outline"
        onPress={async () => {
          if (state.isRecording) {
            await recorder.stop();
            await setAudioModeAsync({ allowsRecording: false });
            if (recorder.uri)
              onCaptured({ uri: recorder.uri, name: 'Recorded-audio.m4a', mimeType: 'audio/mp4' });
            return;
          }
          const permission = await withDeviceInteraction(() => requestRecordingPermissionsAsync());
          if (!permission.granted)
            throw new Error('Microphone permission denied. You can still import audio.');
          await setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
            shouldPlayInBackground: false,
          });
          await recorder.prepareToRecordAsync();
          recorder.record({ forDuration: 120 });
        }}
      />
    </View>
  );
}
function AudioPreview({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return (
    <Button
      title={status.playing ? t('Pause audio') : t('Play audio')}
      tone="outline"
      onPress={async () => {
        if (status.playing) player.pause();
        else {
          if (status.didJustFinish) await player.seekTo(0);
          player.play();
        }
      }}
    />
  );
}
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={{ height: 260, width: '100%' }}
      nativeControls
      fullscreenOptions={{ enable: false }}
    />
  );
}
export function EvidenceMediaPreview({
  bytes,
  mediaType,
}: {
  bytes: Uint8Array;
  mediaType: string;
}) {
  const [uri, setUri] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setUri('');
    setError('');
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mediaType }));
      setUri(url);
      return () => URL.revokeObjectURL(url);
    }
    // Playback engines need a local file. Keep it private/cache-only and erase on unmount/relock.
    const file = new File(
      Paths.cache,
      `preview-${randomUUID()}.${mediaType.startsWith('audio/') ? 'm4a' : 'mp4'}`,
    );
    try {
      file.write(bytes);
      setUri(file.uri);
    } catch {
      setError('Unable to prepare media preview');
    }
    return () => {
      try {
        if (file.exists) file.delete();
      } catch {
        /* Cache may already be cleared by the OS. */
      }
    };
  }, [bytes, mediaType]);
  if (error)
    return (
      <Text accessibilityRole="alert" style={s.muted}>
        {t(error)}
      </Text>
    );
  if (!uri) return <Text style={s.muted}>{t('Preparing preview…')}</Text>;
  return mediaType.startsWith('audio/') ? <AudioPreview uri={uri} /> : <VideoPreview uri={uri} />;
}
