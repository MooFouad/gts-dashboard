import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';
import AttachmentField from '../common/AttachmentField';

const HomeRentForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    district: '',
    project: '',
    contractNumber: '',
    contractStartingDate: '',
    contractEndingDate: '',
    contractStatus: 'Active',
    firstPaymentDate: '',
    secondPaymentDate: '',
    thirdPaymentDate: '',
    fourthPaymentDate: '',
    rentAnnually: '',
    address: '',
    electricityMeterNumber: '',
    contactNo: '',
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
        <FormField label="Property Name" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        <FormField label="Location" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </FormField>

        <FormField label="District">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.district}
            onChange={(e) => handleChange('district', e.target.value)}
          />
        </FormField>

        <FormField label="Contract Number" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.contractNumber}
            onChange={(e) => handleChange('contractNumber', e.target.value)}
          />
        </FormField>

        <FormField label="Contract Start Date" required>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.contractStartingDate}
            onChange={(e) => handleChange('contractStartingDate', e.target.value)}
          />
        </FormField>

        <FormField label="Contract End Date" required>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.contractEndingDate}
            onChange={(e) => handleChange('contractEndingDate', e.target.value)}
          />
        </FormField>

        <FormField label="Annual Rent" required>
          <input
            type="number"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.rentAnnually}
            onChange={(e) => handleChange('rentAnnually', e.target.value)}
          />
        </FormField>

        <FormField label="Electricity Meter">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.electricityMeterNumber}
            onChange={(e) => handleChange('electricityMeterNumber', e.target.value)}
          />
        </FormField>

        <FormField label="First Payment" required highlight>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.firstPaymentDate}
            onChange={(e) => handleChange('firstPaymentDate', e.target.value)}
          />
        </FormField>

        <FormField label="Second Payment" required highlight>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.secondPaymentDate}
            onChange={(e) => handleChange('secondPaymentDate', e.target.value)}
          />
        </FormField>

        <FormField label="Third Payment" required highlight>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.thirdPaymentDate}
            onChange={(e) => handleChange('thirdPaymentDate', e.target.value)}
          />
        </FormField>

        <FormField label="Fourth Payment" required highlight>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.fourthPaymentDate}
            onChange={(e) => handleChange('fourthPaymentDate', e.target.value)}
          />
        </FormField>

        <FormField label="Contact Number">
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={formData.contactNo}
            onChange={(e) => handleChange('contactNo', e.target.value)}
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
        submitText="Add Contract" 
        isEdit={!!initialData} 
      />
    </form>
  );
};

export default HomeRentForm;
