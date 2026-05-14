import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';
import AttachmentField from '../common/AttachmentField';

const VehicleForm = ({ onSubmit, onCancel, initialData = null, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    plateNumber: '',
    registrationType: '',
    vehicleMaker: '',
    vehicleModel: '',
    modelYear: new Date().getFullYear(),
    sequenceNumber: '',
    chassisNumber: '',
    basicColor: '',
    licenseExpiryDate: '',
    inspectionExpiryDate: '',
    actualDriverId: '',
    actualDriverName: '',
    inspectionStatus: 'Valid',
    insuranceStatus: 'Valid',
    attachments: []
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
        {/* 1. Plate Number */}
        <FormField label="1. Plate Number">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.plateNumber}
            onChange={(e) => handleChange('plateNumber', e.target.value)}
          />
        </FormField>

        {/* 2. Registration Type */}
        <FormField label="2. Registration Type">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.registrationType}
            onChange={(e) => handleChange('registrationType', e.target.value)}
          />
        </FormField>

        {/* 3. Brand */}
        <FormField label="3. Brand">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.vehicleMaker}
            onChange={(e) => handleChange('vehicleMaker', e.target.value)}
          />
        </FormField>

        {/* 4. Model */}
        <FormField label="4. Model">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.vehicleModel}
            onChange={(e) => handleChange('vehicleModel', e.target.value)}
          />
        </FormField>

        {/* 5. Year of Manufacture */}
        <FormField label="5. Year of Manufacture">
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={formData.modelYear}
            onChange={(e) => handleChange('modelYear', e.target.value)}
          />
        </FormField>

        {/* 6. Serial Number */}
        <FormField label="6. Serial Number">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.sequenceNumber}
            onChange={(e) => handleChange('sequenceNumber', e.target.value)}
          />
        </FormField>

        {/* 7. Chassis Number */}
        <FormField label="7. Chassis Number">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.chassisNumber}
            onChange={(e) => handleChange('chassisNumber', e.target.value)}
          />
        </FormField>

        {/* 8. Basic Color */}
        <FormField label="8. Basic Color">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.basicColor}
            onChange={(e) => handleChange('basicColor', e.target.value)}
          />
        </FormField>

        {/* 9. License Expiry Date */}
        <FormField label="9. License Expiry Date" highlight>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.licenseExpiryDate}
            onChange={(e) => handleChange('licenseExpiryDate', e.target.value)}
          />
        </FormField>

        {/* 10. Inspection Expiry Date */}
        <FormField label="10. Inspection Expiry Date" highlight>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.inspectionExpiryDate}
            onChange={(e) => handleChange('inspectionExpiryDate', e.target.value)}
          />
        </FormField>

        {/* 11. Actual User ID Number */}
        <FormField label="11. Actual User ID Number">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.actualDriverId}
            onChange={(e) => handleChange('actualDriverId', e.target.value)}
          />
        </FormField>

        {/* 12. Actual User Name */}
        <FormField label="12. Actual User Name">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.actualDriverName}
            onChange={(e) => handleChange('actualDriverName', e.target.value)}
          />
        </FormField>

        {/* 13. Inspection Status */}
        <FormField label="13. Inspection Status">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.inspectionStatus}
            onChange={(e) => handleChange('inspectionStatus', e.target.value)}
          />
        </FormField>

        {/* 14. Insurance Status */}
        <FormField label="14. Insurance Status">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.insuranceStatus}
            onChange={(e) => handleChange('insuranceStatus', e.target.value)}
          />
        </FormField>
      </div>

      <div className="border-t pt-4 mt-4">
        <FormField label="Documents & Attachments">
          <AttachmentField
            attachments={formData.attachments}
            onChange={(attachments) => handleChange('attachments', attachments)}
          />
        </FormField>
      </div>

      <FormActions
        onCancel={onCancel}
        submitText="Add Vehicle"
        isEdit={!!initialData}
        isSubmitting={isSubmitting}
      />
    </form>
  );
};

export default VehicleForm;