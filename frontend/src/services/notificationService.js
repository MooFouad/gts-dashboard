const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class NotificationService {
  static async initialize() {
    try {
      const registration = await this.registerServiceWorker();
      const permission = await this.requestPermission();
      const vapidKey = await this.getVapidKey();
      const subscription = await this.subscribe(registration, vapidKey);
      await this.sendSubscriptionToServer(subscription);
      return true;
    } catch (error) {
      console.error('Notification initialization failed:', error);
      return false;
    }
  }

  static async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    return navigator.serviceWorker.register('/sw.js');
  }

  static async requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }
    return permission;
  }

  static async getVapidKey() {
    const response = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
    if (!response.ok) throw new Error('Failed to get VAPID key');
    const { publicKey } = await response.json();
    return publicKey;
  }

  static async subscribe(registration, vapidKey) {
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
    });
  }

  static async sendSubscriptionToServer(subscription) {
    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    if (!response.ok) throw new Error('Failed to send subscription to server');
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default NotificationService;
