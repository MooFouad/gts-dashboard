// frontend/src/services/pushNotificationService.js
import api from './api';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    try {
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
    } catch (error) {
      console.error('Error converting VAPID key:', error);
      throw new Error('Invalid VAPID key format');
    }
  }

  // Check if notifications are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Completely reset service worker
  async resetServiceWorker() {
    try {
      console.log('🔄 Resetting service worker completely...');
      
      // Unregister all existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        console.log('Unregistering:', registration.scope);
        await registration.unsubscribe?.();
        await registration.unregister();
      }
      
      console.log('✅ All service workers unregistered');
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Register fresh service worker
      console.log('📝 Registering fresh service worker...');
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('✅ Fresh service worker registered');
      
      // Wait for it to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker is ready');
      
      return this.registration;
    } catch (error) {
      console.error('❌ Reset failed:', error);
      throw error;
    }
  }

  // Register service worker (try existing first, then fresh)
  async registerServiceWorker(forceReset = false) {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported in this browser');
      }

      if (forceReset) {
        return await this.resetServiceWorker();
      }

      console.log('🔄 Checking for existing service worker...');
      let existingReg = await navigator.serviceWorker.getRegistration();
      
      if (existingReg) {
        console.log('✅ Using existing service worker registration');
        this.registration = existingReg;
      } else {
        console.log('🔄 Registering new service worker...');
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('✅ Service Worker registered');
      }
      
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker is ready');
      
      return this.registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw new Error(`Failed to register service worker: ${error.message}`);
    }
  }

  // Request notification permission
  async requestPermission() {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      console.log('Current permission:', Notification.permission);

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied. Please enable it in browser settings.');
      }

      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return 'granted';
      }

      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      return permission;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }

  // Subscribe to push notifications (email is optional - for backward compatibility)
  async subscribe(email = null, retryCount = 0) {
    try {
      console.log('🔔 Starting push subscription process...');

      // Step 1: Check browser support
      if (!this.isSupported()) {
        throw new Error('Your browser does not support push notifications');
      }
      console.log('✅ Step 1: Browser supports push notifications');

      // Step 2: Register service worker (force reset on retry)
      await this.registerServiceWorker(retryCount > 0);
      console.log('✅ Step 2: Service worker ready');

      // Step 3: Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
      console.log('✅ Step 3: Notification permission granted');

      // Step 4: Get VAPID public key
      let publicKey = this.vapidPublicKey;
      if (!publicKey) {
        console.log('Fetching VAPID key from server...');
        const response = await api.get('/notifications/vapid-public-key');
        publicKey = response.publicKey;
      }

      if (!publicKey) {
        throw new Error('VAPID public key not found');
      }
      console.log('✅ Step 4: VAPID key obtained');

      // Step 5: Convert VAPID key
      const convertedVapidKey = this.urlBase64ToUint8Array(publicKey);
      console.log('✅ Step 5: VAPID key converted');

      // Step 6: Get the service worker registration
      const swRegistration = await navigator.serviceWorker.ready;
      console.log('✅ Step 6: Service Worker registration ready');

      // Step 7: Check for and remove existing subscription
      try {
        let existingSubscription = await swRegistration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('Found existing subscription, removing...');
          await existingSubscription.unsubscribe();
          console.log('✅ Old subscription removed');
          // Wait a moment after unsubscribe
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.warn('Warning checking existing subscription:', err);
      }

      // Step 8: Create new subscription with error handling
      console.log('Creating new push subscription...');
      console.log('Using applicationServerKey length:', convertedVapidKey.length);
      
      try {
        this.subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      } catch (subError) {
        console.error('❌ Push subscription creation failed:', subError);
        
        // If first attempt, try with fresh service worker
        if (retryCount === 0) {
          console.log('🔄 Retrying with fresh service worker...');
          return await this.subscribe(email, 1);
        }
        
        throw new Error(`Push subscription failed: ${subError.message}. Try: 1) Clear browser data, 2) Restart browser, 3) Check internet connection.`);
      }

      if (!this.subscription) {
        throw new Error('Failed to create push subscription - subscription is null');
      }

      console.log('✅ Step 7: Push subscription created successfully');
      console.log('Subscription endpoint:', this.subscription.endpoint.substring(0, 50) + '...');

      // Step 9: Send subscription to server
      console.log('Sending subscription to server...');
      const serverResponse = await api.post('/notifications/subscribe', {
        subscription: this.subscription.toJSON(),
        email: email || 'anonymous'
      });

      console.log('✅ Step 8: Subscription saved to server:', serverResponse);

      // Step 10: Save email to localStorage (if provided)
      if (email) {
        localStorage.setItem('gts_notification_email', email);
        console.log('✅ Step 9: Email saved to localStorage');
      }

      // Step 11: Verify subscription
      const verifySubscription = await swRegistration.pushManager.getSubscription();
      if (!verifySubscription) {
        throw new Error('Subscription verification failed');
      }
      console.log('✅ Step 10: Subscription verified');

      return { success: true, subscription: this.subscription };
    } catch (error) {
      console.error('❌ Subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      console.log('🔄 Starting unsubscribe process...');
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Unsubscribing from push notifications...');
        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push manager');
        
        try {
          await api.post('/notifications/unsubscribe', {
            endpoint: subscription.endpoint
          });
          console.log('✅ Server notified of unsubscribe');
        } catch (error) {
          console.warn('Warning: Failed to notify server');
        }
      }

      this.subscription = null;
      localStorage.removeItem('gts_notification_email');
      
      console.log('✅ Unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }

  // Check if already subscribed
  async isSubscribed() {
    try {
      if (!this.isSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      this.subscription = subscription;
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Send test PUSH notification (browser only, no email)
  async sendTestNotification() {
    try {
      console.log('Sending test PUSH notification...');
      await api.post('/notifications/test-push');
      console.log('✅ Test push notification sent');
      return true;
    } catch (error) {
      console.error('Error sending test push notification:', error);
      throw error;
    }
  }

  // Send test EMAIL notification to specific email
  async sendTestEmail(email) {
    try {
      console.log('Sending test EMAIL notification to:', email);

      // Use direct fetch with timeout for email (40 seconds - backend has 30s timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000); // 40 seconds

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send test email: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Test email notification sent:', data);
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Email sending timed out after 40 seconds. The email server might be slow or unreachable.');
      }
      console.error('Error sending test email notification:', error);
      throw error;
    }
  }

  // Get current subscription info
  async getSubscriptionInfo() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return { exists: false, reason: 'No service worker registration' };
      }

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        return { exists: false, reason: 'No push subscription found' };
      }

      return {
        exists: true,
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys
      };
    } catch (error) {
      console.error('Error getting subscription info:', error);
      return { exists: false, error: error.message };
    }
  }
}

export default new PushNotificationService();