import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';

const AbsherForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    referenceNumber: '',
    name: '',
    issueDate: '',
    expiryDate: '',
    inspectionExpiryDate: '',
    licenseExpiryDate: '',
    plateNumber: '',
    ownerName: '',
    ownerId: '',
    vehicleType: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reference Number */}
        <FormField label="Reference Number *" required>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.referenceNumber}
            onChange={(e) => handleChange('referenceNumber', e.target.value)}
            required
          />
        </FormField>

        {/* Name */}
        <FormField label="Name *" required>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </FormField>

        {/* Plate Number */}
        <FormField label="Plate Number">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.plateNumber}
            onChange={(e) => handleChange('plateNumber', e.target.value)}
          />
        </FormField>

        {/* Vehicle Type */}
        <FormField label="Vehicle Type">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.vehicleType}
            onChange={(e) => handleChange('vehicleType', e.target.value)}
          />
        </FormField>

        {/* Owner Name */}
        <FormField label="Owner Name">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.ownerName}
            onChange={(e) => handleChange('ownerName', e.target.value)}
          />
        </FormField>

        {/* Owner ID */}
        <FormField label="Owner ID">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.ownerId}
            onChange={(e) => handleChange('ownerId', e.target.value)}
          />
        </FormField>

        {/* Issue Date */}
        <FormField label="Issue Date">
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.issueDate}
            onChange={(e) => handleChange('issueDate', e.target.value)}
          />
        </FormField>

        {/* Registration Expiry Date */}
        <FormField label="Registration Expiry Date *" required>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.expiryDate}
            onChange={(e) => handleChange('expiryDate', e.target.value)}
            required
          />
        </FormField>

        {/* Inspection Expiry Date */}
        <FormField label="Inspection Expiry Date">
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.inspectionExpiryDate}
            onChange={(e) => handleChange('inspectionExpiryDate', e.target.value)}
          />
        </FormField>

        {/* License Expiry Date */}
        <FormField label="License Expiry Date">
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.licenseExpiryDate}
            onChange={(e) => handleChange('licenseExpiryDate', e.target.value)}
          />
        </FormField>
      </div>

      {/* Notes - Full Width */}
      <FormField label="Notes">
        <textarea
          className="w-full border rounded px-3 py-2"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows="3"
        />
      </FormField>

      <FormActions
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitText={initialData ? 'Update' : 'Create'}
      />
    </form>
  );
};

export default AbsherForm;
