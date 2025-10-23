import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, TestTube, AlertCircle, RefreshCw } from 'lucide-react';
import pushNotificationService from '../../services/pushNotificationService';
import api from '../../services/api';

const NotificationSettings = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [debugLog, setDebugLog] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState({
    vehicle: true,
    homeRent: true,
    electricity: true
  });

  const addDebugLog = (msg) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    checkPushSubscription();
    loadSubscriptions();
    const savedEmail = localStorage.getItem('gts_notification_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await api.get('/notifications/subscriptions');
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const checkPushSubscription = async () => {
    try {
      if (!pushNotificationService.isSupported()) {
        return;
      }

      const subscribed = await pushNotificationService.isSubscribed();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address');
      return;
    }

    // Validate at least one notification type selected
    const selectedTypes = Object.keys(notificationTypes).filter(key => notificationTypes[key]);
    if (selectedTypes.length === 0) {
      setMessage('Please select at least one notification type');
      return;
    }

    setLoading(true);
    setMessage('');
    setDebugLog([]);
    addDebugLog('🔔 Starting notification subscription...');

    try {
      if (!pushNotificationService.isSupported()) {
        throw new Error('Your browser does not support push notifications');
      }
      addDebugLog('✅ Browser support verified');

      addDebugLog(`Current permission: ${Notification.permission}`);

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied. Please enable it in browser settings.');
      }

      addDebugLog(`📝 Subscribing to notifications with email and types: ${selectedTypes.join(', ')}...`);
      const result = await pushNotificationService.subscribe(email, selectedTypes);

      addDebugLog('✅ Subscribe method completed');

      setMessage(`✅ Successfully subscribed to ${selectedTypes.join(', ')} notifications! You will receive both browser push and email notifications at 9 AM daily.`);
      addDebugLog('✅ Subscription complete!');

      // Clear email input for next subscription
      setEmail('');

      const isNowSubscribed = await pushNotificationService.isSubscribed();
      addDebugLog(`Verification result: ${isNowSubscribed ? '✅ Confirmed' : '❌ Not found'}`);

      if (!isNowSubscribed) {
        throw new Error('Subscription verification failed');
      }

      await loadSubscriptions();

      // Reset subscription state to allow adding more emails
      setIsSubscribed(false);

    } catch (error) {
      console.error('❌ Subscription error:', error);
      addDebugLog(`❌ FAILED: ${error.message}`);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMessage('');
    setDebugLog([]);
    addDebugLog('🔄 Unsubscribing from notifications...');

    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      setMessage('✅ Successfully unsubscribed from all notifications');
      addDebugLog('✅ Unsubscribed successfully');
      localStorage.removeItem('gts_notification_email');
      setEmail('');
      await loadSubscriptions();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      addDebugLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setMessage('');
    addDebugLog('🧪 Sending test notifications...');

    try {
      const subscribed = await pushNotificationService.isSubscribed();

      // Check if we have any subscriptions at all (email or push)
      if (!subscribed && subscriptions.length === 0) {
        setMessage('⚠️ Please subscribe first before sending test notifications');
        addDebugLog('⚠️ Not subscribed');
        setLoading(false);
        return;
      }

      // Get email from subscriptions
      let testEmail = localStorage.getItem('gts_notification_email');
      if (!testEmail && subscriptions.length > 0) {
        testEmail = subscriptions[0].userEmail;
      }

      // Test browser notification only if subscribed
      if (subscribed) {
        addDebugLog('🔔 Testing browser notification API directly...');
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const testNotif = new Notification('🧪 Direct Browser Test', {
              body: 'This is a direct browser notification test',
              tag: 'direct-test',
              requireInteraction: false
            });
            addDebugLog('✅ Direct browser notification created successfully');
            setTimeout(() => testNotif.close(), 5000);
          } catch (directError) {
            addDebugLog(`❌ Direct notification failed: ${directError.message}`);
          }
        }

        // Send browser push notification
        addDebugLog('📱 Sending browser push notification...');
        try {
          await pushNotificationService.sendTestNotification();
          addDebugLog('✅ Test push notification sent to server');
          addDebugLog('👀 Check Windows notification center (bottom right corner)');
        } catch (pushError) {
          addDebugLog(`⚠️ Push notification failed: ${pushError.message}`);
        }
      } else {
        addDebugLog('ℹ️ No push subscription - skipping browser notification');
      }

      // Send email notification if email is available
      if (testEmail) {
        addDebugLog(`📧 Sending test email to ${testEmail}...`);
        try {
          await pushNotificationService.sendTestEmail(testEmail);
          addDebugLog(`✅ Test email sent to ${testEmail}`);
          addDebugLog('📬 Check your email inbox (may take 1-2 minutes)');
        } catch (emailError) {
          addDebugLog(`⚠️ Email test failed: ${emailError.message}`);
          addDebugLog('Note: Browser notification still works!');
        }
      } else {
        addDebugLog('⚠️ No email found - only browser notification sent');
      }

      setMessage('✅ Test notifications sent! Check your browser and email.');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      addDebugLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubscription = async (subscription) => {
    if (!window.confirm(`Remove subscription for ${subscription.userEmail}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });

      setMessage('✅ Successfully removed subscription');
      await loadSubscriptions();

      // If this is the current subscription, update state
      if (subscription.userEmail === email) {
        setIsSubscribed(false);
        setEmail('');
        localStorage.removeItem('gts_notification_email');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setMessage('');
    addDebugLog('🔄 Refreshing...');

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      addDebugLog(`Found ${registrations.length} service worker(s)`);

      for (let registration of registrations) {
        addDebugLog(`Unregistering: ${registration.scope}`);
        await registration.unregister();
      }

      addDebugLog('✅ All service workers unregistered');
      addDebugLog('Reloading page in 2 seconds...');

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      addDebugLog(`❌ Error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell size={24} className="text-blue-600" />
        <h2 className="text-xl font-semibold">Notification Settings</h2>
      </div>

      {!pushNotificationService.isSupported() ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-900">Push Notifications Not Supported</h3>
              <p className="text-yellow-800 mt-1">
                Your browser does not support push notifications. Please try using Chrome, Firefox, or Edge.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📬 Browser + Email Notifications</h3>
            <p className="text-sm text-blue-800">
              Subscribe once to receive both browser push notifications AND email alerts daily at 9 AM, starting 10 days before expiration dates.
            </p>
          </div>

          {/* Notification Types Selection */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Bell size={16} className="inline mr-2" />
              Choose Notification Types
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notificationTypes.vehicle}
                  onChange={(e) => setNotificationTypes({ ...notificationTypes, vehicle: e.target.checked })}
                  disabled={isSubscribed}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700">
                    🚗 Vehicle Notifications
                  </div>
                  <p className="text-xs text-gray-600">
                    License, inspection, and insurance expiration alerts
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notificationTypes.homeRent}
                  onChange={(e) => setNotificationTypes({ ...notificationTypes, homeRent: e.target.checked })}
                  disabled={isSubscribed}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700">
                    🏠 Home Rent Notifications
                  </div>
                  <p className="text-xs text-gray-600">
                    Rental contract ending date alerts
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notificationTypes.electricity}
                  onChange={(e) => setNotificationTypes({ ...notificationTypes, electricity: e.target.checked })}
                  disabled={isSubscribed}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700">
                    ⚡ Electricity Bill Notifications
                  </div>
                  <p className="text-xs text-gray-600">
                    Unpaid bill due date alerts
                  </p>
                </div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              ⚠️ Select at least one notification type
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              disabled={isSubscribed}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              This email will receive notification emails at 9 AM daily
            </p>
          </div>

          {/* Debug Log */}
          {debugLog.length > 0 && (
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
              {debugLog.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 text-green-800' :
              message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
              'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!isSubscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={loading || !email || !email.includes('@')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell size={18} />
                {loading ? 'Subscribing...' : 'Subscribe to Notifications'}
              </button>
            ) : (
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <BellOff size={18} />
                {loading ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            )}

            <button
              onClick={handleTestNotification}
              disabled={loading || (subscriptions.length === 0 && !isSubscribed)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <TestTube size={18} />
              Send Test
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              title="Clear cache and reload"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {isSubscribed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ Subscribed for {email}
              </p>
              <p className="text-sm text-green-700 mt-1">
                You will receive browser notifications and emails daily at 9 AM
              </p>
            </div>
          )}

          {/* All Subscriptions List */}
          {subscriptions.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                📋 Active Subscriptions ({subscriptions.length})
              </h3>
              <div className="space-y-2">
                {subscriptions.map((subscription) => {
                  const types = subscription.notificationTypes || ['vehicle', 'homeRent', 'electricity'];
                  const typeIcons = {
                    vehicle: '🚗',
                    homeRent: '🏠',
                    electricity: '⚡'
                  };
                  const typeLabels = {
                    vehicle: 'Vehicles',
                    homeRent: 'Home Rent',
                    electricity: 'Electricity'
                  };

                  return (
                    <div
                      key={subscription._id}
                      className="flex items-start justify-between bg-white p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-blue-600" />
                          <span className="text-sm font-medium">{subscription.userEmail}</span>
                        </div>
                        <p className="text-xs text-gray-500 ml-6 mt-1">
                          Added: {new Date(subscription.createdAt).toLocaleDateString()} •
                          Last used: {new Date(subscription.lastUsed).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1 ml-6 mt-2">
                          {types.map(type => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {typeIcons[type]} {typeLabels[type]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSubscription(subscription)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                        title="Remove this subscription"
                      >
                        <BellOff size={14} />
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browser Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🔍 Browser Information:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Notification Permission: <strong>{Notification.permission}</strong></li>
              <li>• Service Worker Support: <strong>{('serviceWorker' in navigator) ? 'Yes' : 'No'}</strong></li>
              <li>• Push Manager Support: <strong>{('PushManager' in window) ? 'Yes' : 'No'}</strong></li>
            </ul>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-900 mb-2">📆 How It Works:</h3>
            <ul className="text-sm text-indigo-800 space-y-2">
              <li>• <strong>Daily checks at 9:00 AM</strong> - Automatic notification system runs</li>
              <li>• <strong>Both channels</strong> - Browser push AND email notifications sent together</li>
              <li>• <strong>Repeated daily</strong> - Starting 10 days before expiration until expiration day</li>
              <li>• <strong>All categories</strong> - Vehicles, rentals, and electricity bills</li>
              <li>• <strong>One subscription</strong> - No need for separate email/browser subscriptions</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">📆 Example Timeline:</h3>
            <p className="text-sm text-green-800 mb-2">If your vehicle license expires on <strong>October 22, 2025</strong>:</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>🔔 October 12 at 9 AM - Browser + Email notification (10 days before)</li>
              <li>🔔 October 13 at 9 AM - Browser + Email notification (9 days before)</li>
              <li>🔔 ... continues daily ...</li>
              <li>🔔 October 22 at 9 AM - Final notification (expiration day)</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">🚨 Browser Notifications Not Showing?</h3>
            <p className="text-sm text-red-800 mb-3">If you don't see browser notifications:</p>
            <ol className="text-sm text-red-800 space-y-2 list-decimal list-inside">
              <li><strong>Check Windows Settings:</strong>
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• Open Windows Settings (Win + I)</li>
                  <li>• Go to System → Notifications</li>
                  <li>• Enable notifications for your browser</li>
                </ul>
              </li>
              <li><strong>Turn Off Focus Assist</strong> in Windows Settings</li>
              <li><strong>Check Browser Permission:</strong> Click lock icon in address bar</li>
              <li><strong>Still not working?</strong> Click "Refresh" button and try again</li>
            </ol>
            <p className="text-sm text-red-800 mt-2">
              <strong>Note:</strong> Email notifications will still work even if browser notifications don't show!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
