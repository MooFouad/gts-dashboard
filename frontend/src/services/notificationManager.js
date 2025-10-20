const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BDSz8C6Y_1LgIxreLI-1...';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class NotificationManager {
  static async initialize() {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW Registered:', registration);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const subscription = await this.getOrCreateSubscription(registration);
      await this.sendSubscriptionToServer(subscription);

      return true;
    } catch (error) {
      console.error('Notification initialization failed:', error);
      return false;
    }
  }

  static async getOrCreateSubscription(registration) {
    try {
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }
      return subscription;
    } catch (error) {
      console.error('Subscription failed:', error);
      throw error;
    }
  }

  static async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
      if (!response.ok) throw new Error('Failed to send subscription to server');
    } catch (error) {
      console.error('Failed to save subscription:', error);
      throw error;
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
