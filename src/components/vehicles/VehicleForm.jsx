import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';
import AttachmentField from '../common/AttachmentField';

const VehicleForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    plateNumber: '',
    plateType: '',
    vehicleMaker: '',
    vehicleModel: '',
    modelYear: new Date().getFullYear(),
    sequenceNumber: '',
    chassisNumber: '',
    licenseExpiryDate: '',
    inspectionExpiryDate: '',
    actualDriverId: '',
    actualDriverName: '',
    mvpiStatus: 'Active',
    insuranceStatus: 'Valid',
    restrictionStatus: 'None',
    istemarahIssueDate: '',
    vehicleStatus: 'Active',
    bodyType: '',
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
        <FormField label="Plate Number" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.plateNumber}
            onChange={(e) => handleChange('plateNumber', e.target.value)}
          />
        </FormField>
        
        <FormField label="Plate Type" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.plateType}
            onChange={(e) => handleChange('plateType', e.target.value)}
          />
        </FormField>
        
        <FormField label="Manufacturer" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.vehicleMaker}
            onChange={(e) => handleChange('vehicleMaker', e.target.value)}
          />
        </FormField>
        
        <FormField label="Model" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.vehicleModel}
            onChange={(e) => handleChange('vehicleModel', e.target.value)}
          />
        </FormField>
        
        <FormField label="Year" required>
          <input
            type="number"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.modelYear}
            onChange={(e) => handleChange('modelYear', e.target.value)}
          />
        </FormField>
        
        <FormField label="Chassis Number" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.chassisNumber}
            onChange={(e) => handleChange('chassisNumber', e.target.value)}
          />
        </FormField>
        
        <FormField label="License Expiry Date" required highlight>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.licenseExpiryDate}
            onChange={(e) => handleChange('licenseExpiryDate', e.target.value)}
          />
        </FormField>
        
        <FormField label="Inspection Expiry Date" required highlight>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.inspectionExpiryDate}
            onChange={(e) => handleChange('inspectionExpiryDate', e.target.value)}
          />
        </FormField>
        
        <FormField label="Driver Name">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.actualDriverName}
            onChange={(e) => handleChange('actualDriverName', e.target.value)}
          />
        </FormField>
        
        <FormField label="Body Type">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.bodyType}
            onChange={(e) => handleChange('bodyType', e.target.value)}
          />
        </FormField>

        <FormField label="Documents & Attachments" className="col-span-2">
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
      />
    </form>
  );
};

export default VehicleForm;