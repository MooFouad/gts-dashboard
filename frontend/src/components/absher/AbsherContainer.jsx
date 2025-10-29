import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
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
  const [items, setItems] = useState([]);

  // Fetch data from Absher API on component mount
  useEffect(() => {
    fetchAbsherData();
  }, []);

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

      if (response.data.success) {
        console.log('✅ Fetched Absher data:', response.data.data);
        setItems(response.data.data);
        alert(`Successfully fetched data for ${response.data.data.length} vehicles from Absher API!`);
      }
    } catch (error) {
      console.error('Error fetching Absher data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch from Absher API';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getEarliestExpiry = (record) => {
    const dates = [
      record.insuranceExpiryDate,
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
          onClick={fetchAbsherData}
          disabled={loading || isGuest}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-4"
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
