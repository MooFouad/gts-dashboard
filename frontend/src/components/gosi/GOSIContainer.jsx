import React, { useState } from 'react';
import GOSITable from './GOSITable';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import { useDataManagement } from '../../hooks/useDataManagement';
import gosiService from '../../services/gosiService';
import { RefreshCw, Database, TestTube } from 'lucide-react';

const GOSIContainer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [syncDialog, setSyncDialog] = useState({ isOpen: false, nin: '' });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const { data: items, deleteItem, loading, error, refreshData } = useDataManagement('gosi');

  const filteredItems = items.filter((item) => {
    // Search filter
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
    let matchStatus = true;
    if (filterStatus !== 'all') {
      matchStatus = item.status === filterStatus;
    }

    return matchSearch && matchStatus;
  });

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

  // GOSI API Sync Functions
  const handleSyncDialog = () => {
    setSyncDialog({ isOpen: true, nin: '' });
    setSyncMessage(null);
  };

  const handleSyncSubmit = async () => {
    if (!syncDialog.nin.trim()) {
      alert('Please enter a National ID or Iqama number');
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      console.log('Syncing employee from GOSI:', syncDialog.nin);
      const result = await gosiService.syncEmployee(syncDialog.nin.trim());

      setSyncMessage({
        type: 'success',
        text: `Successfully synced: ${result.data?.name || syncDialog.nin}`
      });

      // Refresh data after successful sync
      await refreshData();

      // Close dialog after 2 seconds
      setTimeout(() => {
        setSyncDialog({ isOpen: false, nin: '' });
        setSyncMessage(null);
      }, 2000);
    } catch (error) {
      console.error('GOSI sync error:', error);
      setSyncMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to sync from GOSI'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setSyncing(true);

    try {
      console.log('Testing GOSI API connection...');
      const result = await gosiService.testConnection();

      if (result.success) {
        alert(`✅ GOSI API Connection Successful!\n\n${result.message}\n\nYou can now sync employee data.`);
      } else {
        alert(`❌ GOSI API Connection Failed\n\n${result.message}\n\nPlease check your credentials.`);
      }
    } catch (error) {
      console.error('GOSI test error:', error);
      alert(`❌ GOSI API Test Failed\n\n${error.response?.data?.message || error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-200 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">GOSI (Social Insurance)</h2>
          <p className="text-sm text-gray-600">Engagement Deduction API Data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleTestConnection}
            disabled={syncing}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
            title="Test GOSI API Connection"
          >
            <TestTube size={16} />
            Test API
          </button>
          <button
            onClick={handleSyncDialog}
            disabled={syncing}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            title="Sync Employee from GOSI API"
          >
            <Database size={16} />
            {syncing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync from GOSI'
            )}
          </button>
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
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'terminated', label: 'Terminated' }
        ]}
        searchPlaceholder="Search by NIN, name, or occupation..."
      />

      <GOSITable
        data={filteredItems}
        onDelete={handleDelete}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete GOSI Record"
        message="Are you sure you want to delete this GOSI record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />

      {/* GOSI Sync Dialog */}
      <FormDialog
        isOpen={syncDialog.isOpen}
        title="Sync Employee from GOSI API"
        onClose={() => {
          setSyncDialog({ isOpen: false, nin: '' });
          setSyncMessage(null);
        }}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">GOSI Engagement Deduction API</h4>
            <p className="text-sm text-blue-800 mb-2">
              Enter the National ID (NIN) or Iqama number to fetch complete employee data from GOSI.
            </p>
            <p className="text-xs text-blue-700">
              This will retrieve: engagement info, deduction rates, social insurance products, wages, and contribution details.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              National ID / Iqama Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={syncDialog.nin}
              onChange={(e) => setSyncDialog({ ...syncDialog, nin: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Enter NIN or Iqama number"
              disabled={syncing}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSyncSubmit();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Sandbox test: NIN starting with '10' (private), '11' (public), '12' (PR eligible), or Iqama starting with '20'
            </p>
          </div>

          {syncMessage && (
            <div
              className={`p-3 rounded ${
                syncMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {syncMessage.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => {
                setSyncDialog({ isOpen: false, nin: '' });
                setSyncMessage(null);
              }}
              disabled={syncing}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSyncSubmit}
              disabled={syncing || !syncDialog.nin.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database size={16} />
                  Sync from GOSI
                </>
              )}
            </button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
};

export default GOSIContainer;
