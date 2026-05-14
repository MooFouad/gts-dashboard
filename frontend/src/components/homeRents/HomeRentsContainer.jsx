import React, { useState } from 'react';
import HomeRentsTable from './HomeRentsTable';
import HomeRentForm from './HomeRentForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import Pagination from '../common/Pagination';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import { useAuth } from '../../contexts/AuthContext';
import { exportHomeRentsToExcel } from '../../utils/excel/excelUtils';

const HomeRentsContainer = () => {
  const { user } = useAuth();
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: items, addItem, updateItem, deleteItem, loading, error, refreshData, pagination } = useDataManagement('homeRent');

  const filteredItems = items.filter((item) => {
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchStatus = true;
    if (filterStatus !== 'all') {
      const isContractExpired = new Date(item.contractEndingDate) < new Date();
      const hasUpcomingPayment = [
        item.firstPaymentDate,
        item.secondPaymentDate,
        item.thirdPaymentDate,
        item.fourthPaymentDate
      ].some(date => {
        const paymentDate = new Date(date);
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return paymentDate >= now && paymentDate <= thirtyDaysFromNow;
      });

      if (filterStatus === 'expired') {
        matchStatus = isContractExpired;
      } else if (filterStatus === 'warning') {
        matchStatus = !isContractExpired && hasUpcomingPayment;
      } else if (filterStatus === 'valid') {
        matchStatus = !isContractExpired && !hasUpcomingPayment;
      }
    }

    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    setFormDialog({ isOpen: true, data: null });
  };

  const handleEdit = (rent) => {
    setFormDialog({ isOpen: true, data: rent });
  };

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteDialog.id) {
      try {
        await deleteItem(deleteDialog.id);
        setDeleteDialog({ isOpen: false, id: null });
        await refreshData();
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const handleExport = () => {
    try {
      exportHomeRentsToExcel(items);
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
          Home Rentals
          <span className="ml-2 badge-neutral">{items.length}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton onClick={handleExport} label="Export" />
          <button onClick={handleCreate} className="btn-primary !text-sm">
            Add Home Rental
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
      />

      <HomeRentsTable
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
        onClose={() => setFormDialog({ isOpen: false, data: null })}
        title={formDialog.data ? 'Edit Home Rental' : 'Add Home Rental'}
      >
        <HomeRentForm
          initialData={formDialog.data}
          onSubmit={handleSubmit}
          onCancel={() => setFormDialog({ isOpen: false, data: null })}
          isSubmitting={isSubmitting}
        />
      </FormDialog>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this rental property?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default HomeRentsContainer;
