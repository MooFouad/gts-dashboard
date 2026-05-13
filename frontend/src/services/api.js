// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 15000;

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// User-friendly error messages
const getUserMessage = (error, response) => {
  if (error.name === 'AbortError') {
    return 'The server is taking too long to respond. Please try again.';
  }
  if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
    return 'Unable to reach the server. Please check your internet connection.';
  }
  if (response?.status === 503) {
    return 'The service is temporarily unavailable. Please try again in a moment.';
  }
  if (response?.status === 502 || response?.status === 504) {
    return 'The server is temporarily unavailable. Please try again in a moment.';
  }
  return null; // Use the original error message
};

class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.consecutiveFailures = 0;
  }

  _notifyConnectionStatus(online) {
    window.dispatchEvent(new CustomEvent('api:connection-status', {
      detail: { online }
    }));
  }

  async request(endpoint, options = {}, retryCount = 0) {
    try {
      const timeout = options.timeout || DEFAULT_TIMEOUT;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Add auth token to headers
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle 401 Unauthorized
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw new Error('Session expired. Please login again.');
        }

        // Handle 503 DB unavailable - don't retry, DB is down
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'DB_UNAVAILABLE') {
            this.consecutiveFailures++;
            this._notifyConnectionStatus(false);
            throw new Error('The service is temporarily unavailable. Please try again in a moment.');
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const friendlyMessage = getUserMessage(null, response);
          throw new Error(friendlyMessage || errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Success - reset failure counter
        if (this.consecutiveFailures > 0) {
          this.consecutiveFailures = 0;
          this._notifyConnectionStatus(true);
        }

        const data = await response.json();
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      // Don't retry on auth or client errors
      if (error.message.includes('Session expired') || error.message.includes('HTTP error! status: 4')) {
        throw error;
      }

      // Don't retry on DB unavailable (503) - the backend is up but DB is down
      if (error.message.includes('temporarily unavailable')) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = RETRY_DELAY * Math.pow(2, retryCount);

      if (retryCount < MAX_RETRIES - 1) {
        console.log(`API retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retryCount + 1);
      }

      // All retries exhausted
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 2) {
        this._notifyConnectionStatus(false);
      }

      // Return user-friendly message
      const friendlyMessage = getUserMessage(error);
      throw new Error(friendlyMessage || `Failed after ${MAX_RETRIES} attempts: ${error.message}`);
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const api = new ApiService(API_BASE_URL);

export default api;
