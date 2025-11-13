import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import MVPITable from './MVPITable';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MVPIContainer = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load data from database on mount
  useEffect(() => {
    console.log('MVPI tab loaded. Loading data from database...');
    loadFromDatabase();
  }, []);

  // Dispatch count update when items change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('itemCountUpdate', {
      detail: { type: 'mvpi', count: items.length }
    }));
  }, [items]);

  // Load data from database
  const loadFromDatabase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping database load');
      return;
    }

    setLoading(true);

    try {
      console.log('📁 Loading MVPI records from database...');
      const response = await axios.get(
        `${API_URL}/mvpi`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      if (response.data.success) {
        const dbRecords = response.data.data || [];
        console.log(`✅ Loaded ${dbRecords.length} MVPI records from database`);
        setItems(dbRecords);
      }
    } catch (error) {
      console.error('❌ Error loading from database:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel export
  const handleExport = () => {
    try {
      // Simple CSV export
      const headers = ['Plate Number', 'Report Number', 'Center Name', 'Inspection Date', 'Expiry Date', 'Result', 'Status', 'Maker', 'Model', 'Year', 'Odometer'];
      const csvContent = [
        headers.join(','),
        ...items.map(item => [
          item.plateNumber || '',
          item.inspectionReportNumber || '',
          item.inspectionCenterName || '',
          item.inspectionDate || '',
          item.inspectionExpiryDate || '',
          item.inspectionResult || '',
          item.inspectionStatus || '',
          item.maker || '',
          item.model || '',
          item.modelYear || '',
          item.odometerReading || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mvpi_records_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Handle sync from API (sync ALL vehicles)
  const handleSyncFromAPI = async () => {
    if (!confirm('This will sync MVPI data for ALL vehicles from Absher API. This may take several minutes. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Starting bulk MVPI sync...');

      const response = await axios.post(
        `${API_URL}/mvpi/bulk-sync-from-api`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 600000 // 10 minutes timeout for bulk sync
        }
      );

      if (response.data.success) {
        const stats = response.data.stats;
        alert(
          `MVPI sync completed!\n\n` +
          `Total: ${stats.total}\n` +
          `Success: ${stats.success}\n` +
          `Failed: ${stats.failed}\n` +
          `Skipped: ${stats.skipped}`
        );
        await loadFromDatabase();
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert(`Failed to sync from API: ${error.response?.data?.message || error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getExpiryDate = (record) => {
    const expiryDate = record.inspectionExpiryDate;
    if (!expiryDate || expiryDate === 'N/A') return null;
    return new Date(expiryDate);
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchStatus = true;
    if (filterStatus !== 'all') {
      const expiryDate = getExpiryDate(item);
      if (!expiryDate) {
        matchStatus = filterStatus === 'valid';
      } else {
        const isExpired = expiryDate < new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const needsRenewal = expiryDate <= thirtyDaysFromNow && !isExpired;

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
        <span className="ml-3 text-gray-600">Loading from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">
          Vehicle Inspection (MVPI) ({items.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncFromAPI}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing All Vehicles...' : 'Sync All from API'}
          </button>
          <ExportButton onClick={handleExport} label="Export to CSV" />
        </div>
      </div>

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={items.length}
        statusOptions={[
          { value: 'all', label: 'All Status' },
          { value: 'valid', label: 'Valid' },
          { value: 'warning', label: 'Warning' },
          { value: 'expired', label: 'Expired' }
        ]}
        searchPlaceholder="Search MVPI records..."
      />

      {loading && items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Loading MVPI records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No MVPI records found.</p>
          <p className="text-sm">Make sure you have synced Istemarah data first, then click "Sync All from API" to fetch MVPI data for all vehicles.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-2">
            Filtered: {filteredItems.length} of {items.length} records
          </div>
          <MVPITable
            data={filteredItems}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </>
      )}
    </div>
  );
};

export default MVPIContainer;
