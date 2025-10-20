import React, { useState, useEffect } from 'react';
import VehiclesTable from './VehiclesTable';
import VehicleForm from './VehicleForm';
import FormDialog from '../common/FormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import { useDataManagement } from '../../hooks/useDataManagement';
import { exportVehiclesToExcel } from '../../utils/excelUtils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VehiclesContainer = () => {
  const [formDialog, setFormDialog] = useState({ isOpen: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const { data: items, addItem, updateItem, deleteItem, loading, error, refreshData } = useDataManagement('vehicle');

  // Add debug logging
  useEffect(() => {
    console.log('Current items:', items);
    console.log('Loading state:', loading);
    if (error) console.error('Error state:', error);
  }, [items, loading, error]);

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

  const handleSubmit = async (formData) => {
    try {
      if (formDialog.data) {
        console.log('Updating vehicle with data:', formDialog.data);
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
      exportVehiclesToExcel(items);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  const handleAbsherSync = async () => {
    // Check if user is logged in first
    const token = localStorage.getItem('token');
    if (!token) {
      alert('⚠️ يجب تسجيل الدخول أولاً!\n\nالرجاء تسجيل الدخول ثم المحاولة مرة أخرى.');
      return;
    }

    if (!window.confirm('هل أنت متأكد من رغبتك في مزامنة جميع المركبات مع API أبشر؟\n\nسيتم تحديث بيانات المركبات التي لها رقم لوحة ورقم تسلسلي.')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await axios.post(`${API_URL}/absher/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSyncResult(response.data.data);

      // Show results regardless of partial success
      const results = response.data.data;

      if (results.successful > 0) {
        // At least some vehicles synced successfully
        let message = `✅ تمت المزامنة!\n\n`;
        message += `تم تحديث: ${results.successful} مركبة\n`;
        message += `فشل: ${results.failed} مركبة\n`;

        if (results.failed > 0) {
          message += `\n⚠️ بعض المركبات فشلت في المزامنة.\n`;
          message += `يرجى التحقق من تفاصيل الأخطاء أدناه.`;
        }

        alert(message);
        await refreshData(); // Refresh to show updated data
      } else if (results.total > 0) {
        // All vehicles failed
        alert(`❌ فشلت المزامنة لجميع المركبات (${results.total})\n\n` +
              `السبب المحتمل:\n` +
              `- عدم القدرة على الاتصال بـ Absher API\n` +
              `- تحقق من اتصال الإنترنت\n` +
              `- قد تحتاج إلى VPN للوصول إلى الخدمة\n\n` +
              `يرجى مراجعة تفاصيل الأخطاء أدناه.`);
      }
    } catch (error) {
      console.error('Absher sync error:', error);

      // Better error message handling
      let errorMessage = '❌ حدث خطأ أثناء المزامنة مع أبشر:\n\n';

      // Check for authentication errors
      if (error.response?.status === 401 || error.response?.data?.message?.includes('token')) {
        errorMessage = '🔐 انتهت جلسة العمل!\n\n';
        errorMessage += 'الرجاء تسجيل الدخول مرة أخرى ثم المحاولة.';

        // Optionally clear token and redirect to login
        localStorage.removeItem('token');
        // You can redirect to login page here if needed
        // window.location.href = '/login';
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage += 'انتهت مهلة الاتصال. يرجى التحقق من:\n';
        errorMessage += '1. اتصال الإنترنت\n';
        errorMessage += '2. إعدادات VPN (قد تحتاج VPN للوصول إلى Absher API)\n';
        errorMessage += '3. جدار الحماية أو Proxy';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage += 'خطأ في الشبكة. يرجى التحقق من:\n';
        errorMessage += '1. اتصال الإنترنت\n';
        errorMessage += '2. خادم Backend يعمل\n';
        errorMessage += '3. إعدادات CORS';
      } else {
        errorMessage += error.response?.data?.message || error.message;
      }

      alert(errorMessage);
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
        <h2 className="text-xl font-semibold">Vehicles</h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton onClick={handleExport} label="Export Vehicles" />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Vehicle
          </button>
        </div>
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