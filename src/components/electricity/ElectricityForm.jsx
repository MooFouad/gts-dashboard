import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';
import AttachmentField from '../common/AttachmentField';

const ElectricityForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    departmentNumber: '',
    meterNumber: '',
    location: '',
    lastReadingDate: '',
    currentReading: '',
    previousReading: '',
    consumption: '',
    billAmount: '',
    billDate: '',
    dueDate: '',
    paymentDate: '',
    paymentStatus: 'Pending',
    propertyType: '',
    subscriberName: '',
    subscriberNumber: '',
    notes: '',
    attachments: [],
    alertThreshold: '',
    lastMonthConsumption: '',
    consumptionAlert: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Calculate consumption if readings are provided
    const updatedData = {
      ...formData,
      consumption: formData.currentReading && formData.previousReading
        ? Number(formData.currentReading) - Number(formData.previousReading)
        : formData.consumption
    };
    onSubmit(updatedData);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Department Number" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.departmentNumber}
            onChange={(e) => handleChange('departmentNumber', e.target.value)}
          />
        </FormField>

        <FormField label="Meter Number" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.meterNumber}
            onChange={(e) => handleChange('meterNumber', e.target.value)}
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

        <FormField label="Last Reading Date" required>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.lastReadingDate}
            onChange={(e) => handleChange('lastReadingDate', e.target.value)}
          />
        </FormField>

        <FormField label="Current Reading" required>
          <input
            type="number"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.currentReading}
            onChange={(e) => handleChange('currentReading', e.target.value)}
          />
        </FormField>

        <FormField label="Previous Reading" required>
          <input
            type="number"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.previousReading}
            onChange={(e) => handleChange('previousReading', e.target.value)}
          />
        </FormField>

        <FormField label="Bill Amount" required>
          <input
            type="number"
            step="0.01"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.billAmount}
            onChange={(e) => handleChange('billAmount', e.target.value)}
          />
        </FormField>

        <FormField label="Bill Date" required>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.billDate}
            onChange={(e) => handleChange('billDate', e.target.value)}
          />
        </FormField>

        <FormField label="Due Date" required>
          <input
            type="date"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
          />
        </FormField>

        <FormField label="Payment Date">
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={formData.paymentDate || ''}
            onChange={(e) => handleChange('paymentDate', e.target.value)}
          />
        </FormField>

        <FormField label="Payment Status" required>
          <select
            required
            className="w-full border rounded px-3 py-2"
            value={formData.paymentStatus}
            onChange={(e) => handleChange('paymentStatus', e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </FormField>

        <FormField label="Property Type" required>
          <select
            required
            className="w-full border rounded px-3 py-2"
            value={formData.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
          >
            <option value="">Select type</option>
            <option value="Commercial">Commercial</option>
            <option value="Residential">Residential</option>
            <option value="Industrial">Industrial</option>
          </select>
        </FormField>

        <FormField label="Subscriber Name" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.subscriberName}
            onChange={(e) => handleChange('subscriberName', e.target.value)}
          />
        </FormField>

        <FormField label="Subscriber Number" required>
          <input
            type="text"
            required
            className="w-full border rounded px-3 py-2"
            value={formData.subscriberNumber}
            onChange={(e) => handleChange('subscriberNumber', e.target.value)}
          />
        </FormField>

        <FormField label="Notes" className="col-span-2">
          <textarea
            className="w-full border rounded px-3 py-2"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows="3"
          />
        </FormField>

        <FormField label="Alert Threshold (kWh)" className="col-span-1">
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={formData.alertThreshold}
            onChange={(e) => handleChange('alertThreshold', e.target.value)}
            placeholder="Set consumption alert threshold"
          />
        </FormField>

        <FormField label="Last Month's Consumption" className="col-span-1">
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={formData.lastMonthConsumption}
            onChange={(e) => handleChange('lastMonthConsumption', e.target.value)}
            placeholder="Previous month consumption"
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
        submitText={initialData ? "Update Electricity Bill" : "Add Electricity Bill"}
        isEdit={!!initialData}
      />
    </form>
  );
};

export default ElectricityForm;