import React, { useState } from 'react';
import HomeRentsTable from './HomeRentsTable';
import HomeRentForm from './HomeRentForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import { useDataManagement } from '../../hooks/useDataManagement';

const HomeRentsContainer = ({ initialData = [] }) => {
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: items, addItem, updateItem, deleteItem } = useDataManagement(initialData, 'homeRent');

  const filteredItems = items.filter((item) => {
    // Search filter
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
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

  const handleSubmit = (formData) => {
    if (formDialog.data) {
      updateItem(formDialog.data.id, formData);
    } else {
      addItem(formData);
    }
    setFormDialog({ isOpen: false, data: null });
  };

  const handleDelete = (id) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = () => {
    if (deleteDialog.id !== null) {
      deleteItem(deleteDialog.id);
      setDeleteDialog({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Home Rentals</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Home Rental
        </button>
      </div>

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={items.length}
      />

      <HomeRentsTable
        data={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        isOpen={formDialog.isOpen}
        onClose={() => setFormDialog({ isOpen: false, data: null })}
        title={formDialog.data ? 'Edit Home Rental' : 'Add Home Rental'}
      >
        <HomeRentForm
          initialData={formDialog.data}
          onSubmit={handleSubmit}
          onCancel={() => setFormDialog({ isOpen: false, data: null })}
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