import React, { useState } from 'react';
import SocialInsuranceTable from './SocialInsuranceTable';
import SocialInsuranceForm from './SocialInsuranceForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import Pagination from '../common/Pagination';
import { useDataManagement } from '../../hooks/useDataManagement';
import { useAuth } from '../../contexts/AuthContext';
import { exportSocialInsuranceToExcel } from '../../utils/excel/excelUtils';

const SocialInsuranceContainer = () => {
  const { user } = useAuth();
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: items, addItem, updateItem, deleteItem, loading, error, refreshData, pagination } = useDataManagement('socialInsurance');

  const filteredItems = items.filter((item) => {
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

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
    try {
      exportSocialInsuranceToExcel(filteredItems);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
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
        <h2 className="text-lg font-semibold text-slate-800">
          Social Insurance
          <span className="ml-2 badge-neutral">{items.length}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton onClick={handleExport} label="Export" />
          <button onClick={handleCreate} className="btn-primary !text-sm">
            Add Record
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={pagination?.totalItems || items.length}
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

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}

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
