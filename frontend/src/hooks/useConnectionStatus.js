import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const HEALTH_CHECK_INTERVAL = 15000; // 15 seconds when disconnected

const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState(true);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        setIsServerReachable(true);
        window.dispatchEvent(new CustomEvent('api:connection-status', { detail: { online: true } }));
      }
    } catch {
      setIsServerReachable(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setIsServerReachable(false);
    };

    const handleApiStatus = (event) => {
      setIsServerReachable(event.detail.online);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('api:connection-status', handleApiStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('api:connection-status', handleApiStatus);
    };
  }, []);

  // Auto-ping health endpoint when disconnected
  useEffect(() => {
    if (isServerReachable || !isOnline) return;

    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [isServerReachable, isOnline, checkHealth]);

  return { isOnline, isServerReachable, checkHealth };
};

export default useConnectionStatus;
