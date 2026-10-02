import * as Location from 'expo-location';
import { withDeviceInteraction } from '../lib/device-interaction';
import type { Position } from '@suraksha/types';
export interface LocationProvider {
  current(): Promise<{
    locationState: 'AVAILABLE' | 'DENIED' | 'UNAVAILABLE' | 'STALE';
    location?: Position;
  }>;
}
export const deviceLocation: LocationProvider = {
  async current() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await withDeviceInteraction(() =>
        Location.requestForegroundPermissionsAsync(),
      );
      if (permission.status !== 'granted') return { locationState: 'DENIED' };
      const p = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>(
          (_, reject) => (timer = setTimeout(() => reject(new Error('GPS timeout')), 15000)),
        ),
      ]);
      return {
        locationState: Date.now() - p.timestamp > 120000 ? 'STALE' : 'AVAILABLE',
        location: {
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy || 0,
          capturedAt: new Date(p.timestamp).toISOString(),
        },
      };
    } catch {
      return { locationState: 'UNAVAILABLE' };
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};
