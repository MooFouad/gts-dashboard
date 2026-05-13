import React, { useState, useRef, useEffect } from 'react';
import GOSITable from './GOSITable';
import Toolbar from '../layout/Toolbar';
import Pagination from '../common/Pagination';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import gosiService from '../../services/gosiService';
import { exportGOSIToExcel } from '../../utils/excel/excelUtils';
import { RefreshCw, Upload, UserPlus } from 'lucide-react';

const GOSIContainer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [addDialog, setAddDialog] = useState({ isOpen: false, nin: '' });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: items, loading, error, refreshData, upsertLocalItem } = useDataManagement('gosi', {
    usePagination: false
  });

  const getActualStatus = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (item.engagementEndDate) {
      const endDate = new Date(item.engagementEndDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today) return 'terminated';
    }

    if (item.engagementStartDate) {
      const startDate = new Date(item.engagementStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate <= today) return 'active';
    }

    return 'inactive';
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = !searchTerm || Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchStatus = true;
    if (filterStatus !== 'all') {
      const actualStatus = getActualStatus(item);
      matchStatus = actualStatus === filterStatus;
    }

    return matchSearch && matchStatus;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

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

  const handleExport = () => {
    try {
      exportGOSIToExcel(filteredItems);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

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
      const result = await gosiService.syncEmployee(addDialog.nin.trim());

      setSyncMessage({
        type: 'success',
        text: `Successfully synced: ${result.data?.name || addDialog.nin}`
      });

      if (result.data) {
        upsertLocalItem(result.data);
      }

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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);
    setImportMessage(null);

    try {
      const result = await gosiService.importEmployees(file);
      const { total, saved, failed, failedList } = result.results;

      const successMessage = `Import completed!\n\nTotal: ${total}\nSaved: ${saved}\nFailed: ${failed}\n\n` +
        (failedList && failedList.length > 0
          ? `Failed NIns: ${failedList.map(f => f.nin).join(', ')}`
          : 'All employees synced successfully!');

      setImportMessage({
        type: saved > 0 ? 'success' : 'warning',
        text: successMessage
      });

      await refreshData();
      setTimeout(() => setImportMessage(null), 5000);
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import employees';
      setImportMessage({
        type: 'error',
        text: `Import failed: ${errorMessage}`
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-navy-200 border-t-navy-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-rose-600 font-medium mb-2">Error Loading Data</div>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary !text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            GOSI (Social Insurance)
            <span className="ml-2 badge-neutral">{items.length}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Engagement Deduction API Data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <ExportButton onClick={handleExport} label="Export" />
          <button
            onClick={handleAddEmployee}
            disabled={syncing}
            className="btn-outline !text-sm"
            title="Add single employee by NIN/Iqama"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
          <button
            onClick={handleFileSelect}
            disabled={importing}
            className="btn-primary !text-sm"
            title="Upload Excel file with employee Iqama numbers"
          >
            {importing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} />
                Import Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Message */}
      {importMessage && (
        <div className={`card p-4 ${
          importMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          importMessage.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <pre className="whitespace-pre-wrap text-sm">{importMessage.text}</pre>
        </div>
      )}

      {/* Toolbar */}
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

      <GOSITable data={paginatedItems} />

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

      {/* Add Single Employee Dialog */}
      {addDialog.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-modal max-w-md w-full p-6 animate-slide-down">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Employee from GOSI</h3>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 mb-1">
                  Enter the employee's National ID (NIN) or Iqama number to fetch their data from GOSI API.
                </p>
                <p className="text-xs text-blue-600">
                  This will retrieve engagement info, deduction rates, and insurance coverage details.
                </p>
              </div>

              <div>
                <label className="input-label">
                  National ID / Iqama Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addDialog.nin}
                  onChange={(e) => setAddDialog({ ...addDialog, nin: e.target.value })}
                  className="input-field"
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
                <div className={`p-3 rounded-lg border text-sm ${
                  syncMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {syncMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setAddDialog({ isOpen: false, nin: '' });
                    setSyncMessage(null);
                  }}
                  disabled={syncing}
                  className="btn-secondary !text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSyncSubmit}
                  disabled={syncing || !addDialog.nin.trim()}
                  className="btn-primary !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
