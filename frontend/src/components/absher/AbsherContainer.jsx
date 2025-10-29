import React, { useState, useEffect } from 'react';
import { RefreshCw, TestTube } from 'lucide-react';
import AbsherTable from './AbsherTable';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AbsherContainer = () => {
  const { user } = useAuth();
  const isGuest = user?.role === 'guest';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [items, setItems] = useState([]);

  // Don't auto-fetch on mount - let user click the button
  // This prevents immediate timeout errors when API is unavailable
  useEffect(() => {
    // Optional: Load from local cache or show empty state
    console.log('Absher tab loaded. Click "Test Connection" to verify API access.');
  }, []);

  // Test Absher API connection
  const testConnection = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    setTesting(true);

    try {
      const response = await axios.get(
        `${API_URL}/absher/test-connection`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.data.success) {
        const { details } = response.data;
        alert(
          `✅ Connection Successful!\n\n` +
          `Auth URL: ${details.authUrl}\n` +
          `API URL: ${details.apiUrl}\n` +
          `Client ID: ${details.clientId}\n` +
          `Realm: ${details.realmName}\n` +
          `Response Time: ${details.responseTime}\n\n` +
          `You can now fetch vehicle data!`
        );
      }
    } catch (error) {
      console.error('Connection test failed:', error);

      if (error.response?.data) {
        const { message, errorType, details, suggestions } = error.response.data;

        let alertMessage = `❌ Connection Failed\n\n${message}\n\n`;

        if (details) {
          alertMessage += `Configuration:\n`;
          alertMessage += `• Auth URL: ${details.authUrl}\n`;
          alertMessage += `• API URL: ${details.apiUrl}\n`;
          alertMessage += `• Client ID: ${details.clientId}\n`;
          alertMessage += `• Realm: ${details.realmName}\n`;
          alertMessage += `• Response Time: ${details.responseTime}\n\n`;
        }

        if (suggestions && suggestions.length > 0) {
          alertMessage += `Suggestions:\n`;
          suggestions.forEach((suggestion, index) => {
            alertMessage += `${index + 1}. ${suggestion}\n`;
          });
        }

        alert(alertMessage);
      } else {
        alert(
          `❌ Connection Test Failed\n\n` +
          (error.message || 'Unknown error occurred')
        );
      }
    } finally {
      setTesting(false);
    }
  };

  // Fetch Absher data from API
  const fetchAbsherData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/absher/fetch-from-api`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 900000 // 15 minutes for bulk fetch
        }
      );

      // Check if API is unreachable
      if (!response.data.success && response.data.error === 'API_UNREACHABLE') {
        console.error('❌ Absher API is unreachable');
        alert(
          `⚠️ Absher API Connection Failed\n\n` +
          response.data.message
        );
        return;
      }

      if (response.data.success) {
        const { data, summary } = response.data;
        console.log('✅ Fetched Absher data:', data);

        // Filter out error results for display
        const successfulData = data.filter(item => item.status === 'success');
        setItems(successfulData);

        // Show summary
        if (summary) {
          const message =
            `📊 Fetch Complete!\n\n` +
            `✅ Successful: ${summary.successful}\n` +
            `❌ Failed: ${summary.errors}\n` +
            `⏱️ Timeouts: ${summary.timeouts}\n` +
            `📦 Total: ${summary.total}\n\n` +
            (summary.successful > 0
              ? `Displaying ${successfulData.length} vehicles with data.`
              : `No data was fetched. Please check your VPN/network connection.`);

          alert(message);
        } else {
          alert(`Successfully fetched data for ${successfulData.length} vehicles from Absher API!`);
        }
      }
    } catch (error) {
      console.error('Error fetching Absher data:', error);

      // Handle different error types
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        alert(
          `⏱️ Request Timeout\n\n` +
          `The request took too long to complete. This may be due to:\n` +
          `• Slow network connection\n` +
          `• Server overload\n` +
          `• Large number of vehicles\n\n` +
          `Please try again or contact support.`
        );
      } else if (error.response?.status === 503) {
        alert(
          `⚠️ Service Unavailable\n\n` +
          (error.response.data.message || 'The Absher API service is currently unavailable.')
        );
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch from Absher API';
        alert(`❌ Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getEarliestExpiry = (record) => {
    // Handle both date field names (API returns insuranceExpiryDate and inspectionExpiryDate)
    const dates = [
      record.insuranceExpiryDate || record.expiryDate,
      record.inspectionExpiryDate
    ].filter(date => date);

    if (dates.length === 0) return null;

    return new Date(Math.min(...dates.map(d => new Date(d))));
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchStatus = true;
    if (filterStatus !== 'all') {
      const earliestExpiry = getEarliestExpiry(item);
      if (!earliestExpiry) {
        matchStatus = filterStatus === 'valid';
      } else {
        const isExpired = earliestExpiry < new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const needsRenewal = earliestExpiry <= thirtyDaysFromNow && !isExpired;

        if (filterStatus === 'expired') {
          matchStatus = isExpired;
        } else if (filterStatus === 'warning') {
          matchStatus = needsRenewal;
        } else if (filterStatus === 'valid') {
          matchStatus = !isExpired && !needsRenewal;
        }
      }
    }

    return matchSearch && matchStatus;
  });

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Status</option>
            <option value="valid">Valid</option>
            <option value="warning">Warning</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button
          onClick={testConnection}
          disabled={testing || isGuest}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-4"
          title="Test Absher API connection"
        >
          <TestTube size={18} className={testing ? 'animate-pulse' : ''} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={fetchAbsherData}
          disabled={loading || isGuest}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-2"
          title="Refresh data from Absher API"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh from Absher API'}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        Total: {items.length} vehicles | Filtered: {filteredItems.length}
      </div>

      <AbsherTable
        data={filteredItems}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default AbsherContainer;
