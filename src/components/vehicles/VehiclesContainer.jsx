import React, { useState } from 'react';
import VehiclesTable from './VehiclesTable';
import VehicleForm from './VehicleForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import { useDataManagement } from '../../hooks/useDataManagement';

const VehiclesContainer = ({ initialData = [] }) => {
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: items, addItem, updateItem, deleteItem } = useDataManagement(initialData, 'vehicle');

  const filteredItems = items.filter((item) => {
    // Search filter
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
    let matchStatus = true;
    if (filterStatus !== 'all') {
      const isLicenseExpired = new Date(item.licenseExpiryDate) < new Date();
      const isInspectionExpired = new Date(item.inspectionExpiryDate) < new Date();
      
      if (filterStatus === 'expired') {
        matchStatus = isLicenseExpired || isInspectionExpired;
      } else if (filterStatus === 'warning') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const licenseNeedsRenewal = new Date(item.licenseExpiryDate) <= thirtyDaysFromNow && !isLicenseExpired;
        const inspectionNeedsRenewal = new Date(item.inspectionExpiryDate) <= thirtyDaysFromNow && !isInspectionExpired;
        matchStatus = licenseNeedsRenewal || inspectionNeedsRenewal;
      } else if (filterStatus === 'valid') {
        matchStatus = !isLicenseExpired && !isInspectionExpired;
      }
    }

    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    setFormDialog({ isOpen: true, data: null });
  };

  const handleEdit = (vehicle) => {
    setFormDialog({ isOpen: true, data: vehicle });
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
        <h2 className="text-xl font-semibold">Vehicles</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Vehicle
        </button>
      </div>

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={items.length}
      />

      <VehiclesTable
        data={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        isOpen={formDialog.isOpen}
        onClose={() => setFormDialog({ isOpen: false, data: null })}
        title={formDialog.data ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <VehicleForm
          initialData={formDialog.data}
          onSubmit={handleSubmit}
          onCancel={() => setFormDialog({ isOpen: false, data: null })}
        />
      </FormDialog>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this vehicle?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default VehiclesContainer;