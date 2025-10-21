import React, { useState } from 'react';
import ElectricityTable from './ElectricityTable';
import ElectricityForm from './ElectricityForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import { useAuth } from '../../contexts/AuthContext';
import { exportElectricityToExcel } from '../../utils/excelUtils';

const ElectricityContainer = () => {
  const { user } = useAuth();
  const isGuest = user?.role === 'guest';
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [importing, setImporting] = useState(false);
  const { data: items, addItem, updateItem, deleteItem, loading, error, refreshData } = useDataManagement('electricity');

  const filteredItems = items.filter((item) => {
    // Search filter
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
    let matchStatus = true;
    if (filterStatus !== 'all') {
      const today = new Date();
      const dueDate = new Date(item.dueDate);
      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
      
      if (filterStatus === 'expired') {
        matchStatus = dueDate < today;
      } else if (filterStatus === 'warning') {
        matchStatus = dueDate <= tenDaysFromNow && dueDate > today;
      } else if (filterStatus === 'valid') {
        matchStatus = dueDate > tenDaysFromNow;
      }
    }

    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    setFormDialog({ isOpen: true, data: null });
  };

  const handleEdit = (bill) => {
    setFormDialog({ isOpen: true, data: bill });
  };

  const handleSubmit = async (formData) => {
    try {
      if (formDialog.data) {
        console.log('Updating item with ID:', formDialog.data._id);
        console.log('Update data:', formData);

        await updateItem(formDialog.data._id, {
          ...formData,
          _id: formDialog.data._id
        });
      } else {
        await addItem(formData);
      }
      setFormDialog({ isOpen: false, data: null });
      // Refresh data to ensure UI is updated
      await refreshData();
    } catch (err) {
      console.error('Form submission error:', err);
      alert(`Error: ${err.message || 'Failed to save changes. Please try again.'}`);
    }
  };

  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.id !== null) {
      await deleteItem(deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null });
      // Refresh data to ensure UI is updated
      await refreshData();
    }
  };

  const handleExport = () => {
    try {
      exportElectricityToExcel(items);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  const handleImport = async (file) => {
    try {
      setImporting(true);
      const result = await importElectricityFromExcel(file, addItem);
      alert(`Successfully imported ${result.count} electricity bill records!`);
      await refreshData();
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import data: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (loading && !importing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-6 border border-red-200 rounded bg-red-50">
        <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">
          Electricity Bills {isGuest && <span className="text-sm text-gray-500 font-normal">(Demo Mode - Read Only)</span>}
        </h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton onClick={handleExport} label="Export Electricity Bills" />
          {!isGuest && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Electricity Bill
            </button>
          )}
        </div>
      </div>

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={items.length}
      />

      <ElectricityTable
        data={filteredItems}
        onEdit={!isGuest ? handleEdit : null}
        onDelete={!isGuest ? handleDelete : null}
      />

      <FormDialog
        isOpen={formDialog.isOpen}
        onClose={() => setFormDialog({ isOpen: false, data: null })}
        title={formDialog.data ? 'Edit Electricity Bill' : 'Add Electricity Bill'}
      >
        <ElectricityForm
          initialData={formDialog.data}
          onSubmit={handleSubmit}
          onCancel={() => setFormDialog({ isOpen: false, data: null })}
        />
      </FormDialog>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this electricity bill?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default ElectricityContainer;