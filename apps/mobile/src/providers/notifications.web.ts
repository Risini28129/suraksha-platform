import { withDeviceInteraction } from '../lib/device-interaction';
export const deviceNotifications = {
  async requestPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    return withDeviceInteraction(
      async () => (await Notification.requestPermission()) === 'granted',
    );
  },
  async showLocal(title: string, body: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted')
      new Notification(title, { body });
  },
};
