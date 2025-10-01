import React, { useState } from 'react';
import ElectricityTable from './ElectricityTable';
import ElectricityForm from './ElectricityForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import { useDataManagement } from '../../hooks/useDataManagement';

const ElectricityContainer = ({ initialData = [] }) => {
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: items, addItem, updateItem, deleteItem } = useDataManagement(initialData, 'electricity');

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
        <h2 className="text-xl font-semibold">Electricity Bills</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Electricity Bill
        </button>
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
        onEdit={handleEdit}
        onDelete={handleDelete}
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