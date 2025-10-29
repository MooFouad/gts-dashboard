import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import AbsherTable from './AbsherTable';
import AbsherForm from './AbsherForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AbsherContainer = () => {
  const { user } = useAuth();
  const isGuest = user?.role === 'guest';
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [syncDialog, setSyncDialog] = useState({ isOpen: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncFormData, setSyncFormData] = useState({
    plateNumber: '',
    sequenceNumber: '',
    referenceNumber: '',
    name: ''
  });
  const { data: items, addItem, updateItem, deleteItem, loading, error, refreshData } = useDataManagement('absher');

  useEffect(() => {
    console.log('Current absher items:', items);
    console.log('Loading state:', loading);
    if (error) console.error('Error state:', error);
  }, [items, loading, error]);

  const getEarliestExpiry = (record) => {
    const dates = [
      record.expiryDate,
      record.inspectionExpiryDate,
      record.licenseExpiryDate
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

  const handleCreate = () => {
    setFormDialog({ isOpen: true, data: null });
  };

  const handleEdit = (record) => {
    setFormDialog({ isOpen: true, data: record });
  };

  const handleSubmit = async (formData) => {
    try {
      if (formDialog.data) {
        await updateItem(formDialog.data._id, {
          ...formData,
          _id: formDialog.data._id
        });
      } else {
        await addItem(formData);
      }
      setFormDialog({ isOpen: false, data: null });
      await refreshData();
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Error: Failed to save changes. Please try again.');
    }
  };

  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.id !== null) {
      await deleteItem(deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null });
      await refreshData();
    }
  };

  const handleExport = () => {
    const dataToExport = filteredItems.map(item => ({
      'Reference Number': item.referenceNumber,
      'Name': item.name,
      'Plate Number': item.plateNumber,
      'Issue Date': item.issueDate,
      'Registration Expiry': item.expiryDate,
      'Inspection Expiry': item.inspectionExpiryDate,
      'License Expiry': item.licenseExpiryDate,
      'Owner Name': item.ownerName,
      'Owner ID': item.ownerId,
      'Notes': item.notes
    }));

    const headers = Object.keys(dataToExport[0] || {});
    const csv = [
      headers.join(','),
      ...dataToExport.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = 'absher-records-' + today + '.csv';
    a.click();
  };

  const handleSyncClick = () => {
    setSyncDialog({ isOpen: true });
    setSyncFormData({
      plateNumber: '',
      sequenceNumber: '',
      referenceNumber: '',
      name: ''
    });
  };

  const handleBulkSyncFromAPI = async () => {
    if (!window.confirm('⚠️ This will fetch data from Absher API for ALL vehicles.\n\nNote: This may take several minutes (1 second per vehicle).\n\nTotal vehicles: ' + items.length + '\nEstimated time: ~' + Math.ceil(items.length / 60) + ' minutes\n\nContinue?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to sync with Absher API');
      return;
    }

    setSyncingAll(true);

    try {
      const response = await axios.post(
        `${API_URL}/absher/bulk-sync-from-api`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 600000 // 10 minutes timeout for bulk operation
        }
      );

      if (response.data.success) {
        const { total, synced, created, updated, skipped, failed, errors } = response.data.data;

        let message = `🎉 Bulk API Sync Complete!\n\n`;
        message += `📊 Total Vehicles: ${total}\n`;
        message += `✅ Successfully Synced: ${synced}\n`;
        message += `➕ Created New: ${created}\n`;
        message += `🔄 Updated Existing: ${updated}\n`;
        message += `⏭️  Skipped: ${skipped}\n`;
        message += `❌ Failed: ${failed}\n`;

        if (errors.length > 0) {
          message += `\n⚠️ Errors (${errors.length}):\n`;
          errors.slice(0, 5).forEach(err => {
            message += `  - ${err.plateNumber}: ${err.error}\n`;
          });
          if (errors.length > 5) {
            message += `  ... and ${errors.length - 5} more errors\n`;
          }
        }

        alert(message);
        await refreshData();
      }
    } catch (error) {
      console.error('Bulk API sync error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync from Absher API';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncAllFromVehicles = async () => {
    if (!window.confirm('This will sync all vehicles from the Vehicles tab to Absher records (local database only). Continue?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to sync vehicles');
      return;
    }

    setSyncingAll(true);

    try {
      const response = await axios.post(
        `${API_URL}/absher/sync-all-from-vehicles`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { total, synced, created, updated, skipped, errors } = response.data.data;

        let message = `Sync Complete!\n\n`;
        message += `Total Vehicles: ${total}\n`;
        message += `✅ Synced: ${synced}\n`;
        message += `➕ Created: ${created}\n`;
        message += `🔄 Updated: ${updated}\n`;
        message += `⏭️  Skipped: ${skipped}\n`;

        if (errors.length > 0) {
          message += `\n❌ Errors: ${errors.length}\n`;
          errors.slice(0, 5).forEach(err => {
            message += `  - ${err.plateNumber}: ${err.error}\n`;
          });
          if (errors.length > 5) {
            message += `  ... and ${errors.length - 5} more errors\n`;
          }
        }

        alert(message);
        await refreshData();
      }
    } catch (error) {
      console.error('Sync all error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync vehicles';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first to sync with Absher API');
      return;
    }

    if (!syncFormData.plateNumber) {
      alert('Plate number is required');
      return;
    }

    setSyncing(true);

    try {
      const response = await axios.post(
        `${API_URL}/absher/sync`,
        syncFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Successfully synced with Absher API!');
        setSyncDialog({ isOpen: false });
        setSyncFormData({ plateNumber: '', sequenceNumber: '', referenceNumber: '', name: '' });
        await refreshData();
      }
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync with Absher API';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={items.length}
        onCreate={handleCreate}
        isGuest={isGuest}
        actionButtons={
          <>
            <button
              onClick={handleBulkSyncFromAPI}
              disabled={syncingAll || isGuest}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Fetch data from Absher API for ALL vehicles (real government data)"
            >
              <RefreshCw size={18} className={syncingAll ? 'animate-spin' : ''} />
              {syncingAll ? 'Syncing from API...' : 'Sync All from Absher API'}
            </button>
            <button
              onClick={handleSyncAllFromVehicles}
              disabled={syncingAll || isGuest}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Sync all vehicles from Vehicles tab (local database)"
            >
              <RefreshCw size={18} className={syncingAll ? 'animate-spin' : ''} />
              {syncingAll ? 'Syncing...' : 'Sync from Database'}
            </button>
            <button
              onClick={handleSyncClick}
              disabled={syncing || isGuest}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Sync single vehicle with Absher API"
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Single'}
            </button>
            <ExportButton onClick={handleExport} disabled={filteredItems.length === 0} />
          </>
        }
      />

      <AbsherTable
        data={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        isOpen={formDialog.isOpen}
        onClose={() => setFormDialog({ isOpen: false, data: null })}
        title={formDialog.data ? 'Edit Absher Record' : 'Add Absher Record'}
      >
        <AbsherForm
          onSubmit={handleSubmit}
          onCancel={() => setFormDialog({ isOpen: false, data: null })}
          initialData={formDialog.data}
        />
      </FormDialog>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Absher Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
      />

      <FormDialog
        isOpen={syncDialog.isOpen}
        onClose={() => setSyncDialog({ isOpen: false })}
        title="Sync with Absher API"
      >
        <form onSubmit={handleSyncSubmit} className="space-y-4 p-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <p className="text-sm text-blue-800">
              This will fetch vehicle insurance details from the Absher API and store them in your database.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plate Number *
            </label>
            <input
              type="text"
              value={syncFormData.plateNumber}
              onChange={(e) => setSyncFormData({ ...syncFormData, plateNumber: e.target.value })}
              placeholder="e.g., أ م ح 9459"
              className="w-full border rounded px-3 py-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: text1 text2 text3 number</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence Number (Optional)
            </label>
            <input
              type="text"
              value={syncFormData.sequenceNumber}
              onChange={(e) => setSyncFormData({ ...syncFormData, sequenceNumber: e.target.value })}
              placeholder="Vehicle sequence number"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <input
              type="text"
              value={syncFormData.referenceNumber}
              onChange={(e) => setSyncFormData({ ...syncFormData, referenceNumber: e.target.value })}
              placeholder="Reference or Istimara number"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              value={syncFormData.name}
              onChange={(e) => setSyncFormData({ ...syncFormData, name: e.target.value })}
              placeholder="Vehicle or owner name"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setSyncDialog({ isOpen: false })}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={syncing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={syncing}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Sync
                </>
              )}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
};

export default AbsherContainer;
