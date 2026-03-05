import React, { useState, useRef, useEffect } from 'react';
import GOSITable from './GOSITable';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import Pagination from '../common/Pagination';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import gosiService from '../../services/gosiService';
import { exportGOSIToExcel } from '../../utils/excel/excelUtils';
import { RefreshCw, Upload, FileSpreadsheet, UserPlus, Trash2 } from 'lucide-react';

const GOSIContainer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [addDialog, setAddDialog] = useState({ isOpen: false, nin: '' });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch all items without server pagination for instant client-side search
  const { data: items, deleteItem, loading, error, refreshData, upsertLocalItem } = useDataManagement('gosi', {
    usePagination: false
  });

  // Calculate actual status based on engagement dates
  const getActualStatus = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (item.engagementEndDate) {
      const endDate = new Date(item.engagementEndDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return 'terminated';
      }
    }

    if (item.engagementStartDate) {
      const startDate = new Date(item.engagementStartDate);
      startDate.setHours(0, 0, 0, 0);

      if (startDate <= today) {
        return 'active';
      }
    }

    return 'inactive';
  };

  // Client-side filtering (instant, no delay)
  const filteredItems = items.filter((item) => {
    // Search filter
    const matchSearch = !searchTerm || Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
    let matchStatus = true;
    if (filterStatus !== 'all') {
      const actualStatus = getActualStatus(item);
      matchStatus = actualStatus === filterStatus;
    }

    return matchSearch && matchStatus;
  });

  // Client-side pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
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

  const handleDeleteAll = () => {
    setDeleteAllDialog(true);
  };

  const confirmDeleteAll = async () => {
    try {
      const itemIds = items.map(item => item._id);

      if (itemIds.length === 0) {
        alert('No items to delete');
        return;
      }

      console.log(`🗑️ Deleting all ${itemIds.length} GOSI records...`);

      // Call bulk delete API
      await gosiService.bulkDelete(itemIds);

      setDeleteAllDialog(false);
      await refreshData();

      console.log('✅ All GOSI records deleted successfully');
    } catch (error) {
      console.error('Error deleting all records:', error);
      alert('Failed to delete all records. Please try again.');
    }
  };

  const handleExport = () => {
    try {
      exportGOSIToExcel(filteredItems);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  // Single Employee Sync Functions
  const handleAddEmployee = () => {
    setAddDialog({ isOpen: true, nin: '' });
    setSyncMessage(null);
  };

  const handleSyncSubmit = async () => {
    if (!addDialog.nin.trim()) {
      alert('Please enter a National ID or Iqama number');
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      console.log('Syncing employee from GOSI:', addDialog.nin);
      const result = await gosiService.syncEmployee(addDialog.nin.trim());

      setSyncMessage({
        type: 'success',
        text: `Successfully synced: ${result.data?.name || addDialog.nin}`
      });

      // Update local state directly — no need to re-fetch all 167+ records
      if (result.data) {
        upsertLocalItem(result.data);
      }

      // Close dialog after 2 seconds
      setTimeout(() => {
        setAddDialog({ isOpen: false, nin: '' });
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

  // File Upload and Import Functions
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);
    setImportMessage(null);

    try {
      console.log('📤 Uploading Excel file:', file.name);

      const result = await gosiService.importEmployees(file);

      const { total, saved, failed, failedList } = result.results;

      // Show result message
      const successMessage = `✅ Import completed!\n\n` +
        `Total: ${total}\n` +
        `Saved: ${saved}\n` +
        `Failed: ${failed}\n\n` +
        (failedList && failedList.length > 0
          ? `Failed NIns: ${failedList.map(f => f.nin).join(', ')}`
          : 'All employees synced successfully!');

      setImportMessage({
        type: saved > 0 ? 'success' : 'warning',
        text: successMessage
      });

      // Refresh data
      await refreshData();

      // Clear message after 5 seconds
      setTimeout(() => setImportMessage(null), 5000);

    } catch (error) {
      console.error('❌ Import error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import employees';
      setImportMessage({
        type: 'error',
        text: `❌ Import failed: ${errorMessage}`
      });
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <ExportButton
            onClick={handleExport}
            label="Export to Excel"
            isLoading={false}
          />
          <button
            onClick={handleAddEmployee}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            title="Add single employee by NIN/Iqama"
          >
            <UserPlus size={18} />
            Add Single Employee
          </button>
          <button
            onClick={handleFileSelect}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            title="Upload Excel file with employee Iqama numbers"
          >
            {importing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Import from Excel
              </>
            )}
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={items.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
            title="Delete all GOSI records"
          >
            <Trash2 size={18} />
            Delete All ({items.length})
          </button>
        </div>
      </div>

      {/* Import Message */}
      {importMessage && (
        <div className={`p-4 rounded mb-4 ${
          importMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          importMessage.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
          'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <pre className="whitespace-pre-wrap text-sm font-mono">{importMessage.text}</pre>
        </div>
      )}

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={filteredItems.length}
        statusOptions={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'terminated', label: 'Terminated' }
        ]}
        searchPlaceholder="Search by NIN, name, or occupation..."
      />

      <GOSITable
        data={paginatedItems}
        onDelete={handleDelete}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete GOSI Record"
        message="Are you sure you want to delete this GOSI record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />

      <ConfirmDialog
        isOpen={deleteAllDialog}
        title="Delete All GOSI Records"
        message={`Are you sure you want to delete ALL ${items.length} GOSI records? This action cannot be undone and will permanently remove all employee data from the database.`}
        onConfirm={confirmDeleteAll}
        onCancel={() => setDeleteAllDialog(false)}
      />

      {/* Add Single Employee Dialog */}
      {addDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Add Single Employee from GOSI</h3>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  Enter the employee's National ID (NIN) or Iqama number to fetch their data from GOSI API.
                </p>
                <p className="text-xs text-blue-700">
                  This will retrieve engagement info, deduction rates, and insurance coverage details.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  National ID / Iqama Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addDialog.nin}
                  onChange={(e) => setAddDialog({ ...addDialog, nin: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter NIN or Iqama number"
                  disabled={syncing}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && addDialog.nin.trim()) {
                      handleSyncSubmit();
                    }
                  }}
                />
              </div>

              {syncMessage && (
                <div
                  className={`p-3 rounded border ${
                    syncMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {syncMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setAddDialog({ isOpen: false, nin: '' });
                    setSyncMessage(null);
                  }}
                  disabled={syncing}
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSyncSubmit}
                  disabled={syncing || !addDialog.nin.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {syncing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Add Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GOSIContainer;
