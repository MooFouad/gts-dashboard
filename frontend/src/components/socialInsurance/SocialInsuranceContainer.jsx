import React, { useState } from 'react';
import SocialInsuranceTable from './SocialInsuranceTable';
import SocialInsuranceForm from './SocialInsuranceForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import { useAuth } from '../../contexts/AuthContext';

const SocialInsuranceContainer = () => {
  const { user } = useAuth();
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: items, addItem, updateItem, deleteItem, loading, error, refreshData } = useDataManagement('socialInsurance');

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
      await refreshData();
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'ID', 'Division', 'Start Date', 'End Date', 'Remaining Days', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredItems.map(item => [
        item.name,
        item.nin,
        item.division,
        item.startDate,
        item.endDate,
        item.remainingDays || '',
        item.status
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `social-insurance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
        <h2 className="text-xl font-semibold">
          Social Insurance
        </h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton onClick={handleExport} label="Export Records" />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Record
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
          { value: 'expiring-soon', label: 'Expiring Soon' },
          { value: 'expired', label: 'Expired' }
        ]}
        searchPlaceholder="Search by name, ID, or division..."
      />

      <SocialInsuranceTable
        data={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        isOpen={formDialog.isOpen}
        title={formDialog.data ? 'Edit Social Insurance' : 'Add Social Insurance'}
        onClose={() => setFormDialog({ isOpen: false, data: null })}
      >
        <SocialInsuranceForm
          initialData={formDialog.data}
          onSubmit={handleSubmit}
          onCancel={() => setFormDialog({ isOpen: false, data: null })}
        />
      </FormDialog>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Social Insurance Record"
        message="Are you sure you want to delete this social insurance record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default SocialInsuranceContainer;
