import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';
import AttachmentField from '../common/AttachmentField';

const ElectricityForm = ({ onSubmit, onCancel, initialData = null, nextNo = null }) => {
  const [formData, setFormData] = useState({
    no: '',
    account: '',
    name: '',
    city: '',
    address: '',
    project: '',
    division: '',
    meterNumber: '',
    date: '',
    dueDate: '',
    previousReading: 0,
    currentReading: 0,
    consumption: 0,
    alertThreshold: 0,
    consumptionAlert: false,
    attachments: []
  });

  useEffect(() => {
    if (initialData) {
      // Format dates for date inputs
      const formatted = { ...initialData };
      if (formatted.date && !formatted.date.includes('T')) {
        formatted.date = formatted.date;
      } else if (formatted.date) {
        formatted.date = formatted.date.split('T')[0];
      }
      if (formatted.dueDate && !formatted.dueDate.includes('T')) {
        formatted.dueDate = formatted.dueDate;
      } else if (formatted.dueDate) {
        formatted.dueDate = formatted.dueDate.split('T')[0];
      }
      setFormData(formatted);
    } else if (nextNo) {
      // Set auto-generated number for new items
      setFormData(prev => ({ ...prev, no: nextNo.toString() }));
    }
  }, [initialData, nextNo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };

    // Auto-calculate consumption when readings change
    if (field === 'currentReading' || field === 'previousReading') {
      const current = parseFloat(field === 'currentReading' ? value : updated.currentReading) || 0;
      const previous = parseFloat(field === 'previousReading' ? value : updated.previousReading) || 0;
      updated.consumption = Math.max(0, current - previous);

      // Check alert threshold
      if (updated.alertThreshold > 0 && updated.consumption > updated.alertThreshold) {
        updated.consumptionAlert = true;
      } else {
        updated.consumptionAlert = false;
      }
    }

    setFormData(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="No.">
          <input
            type="text"
            className="input-field !bg-slate-100 cursor-not-allowed"
            value={formData.no}
            onChange={(e) => handleChange('no', e.target.value)}
            readOnly
            disabled
            title="Auto-generated based on total count"
          />
          <p className="text-xs text-slate-400 mt-1">Auto-generated</p>
        </FormField>

        <FormField label="Account">
          <input
            type="text"
            className="input-field"
            value={formData.account}
            onChange={(e) => handleChange('account', e.target.value)}
          />
        </FormField>

        <FormField label="Name">
          <input
            type="text"
            className="input-field"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </FormField>

        <FormField label="City">
          <input
            type="text"
            className="input-field"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </FormField>

        <FormField label="Address">
          <input
            type="text"
            className="input-field"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </FormField>

        <FormField label="Project">
          <input
            type="text"
            className="input-field"
            value={formData.project}
            onChange={(e) => handleChange('project', e.target.value)}
          />
        </FormField>

        <FormField label="Division">
          <input
            type="text"
            className="input-field"
            value={formData.division}
            onChange={(e) => handleChange('division', e.target.value)}
          />
        </FormField>

        <FormField label="Meter Number">
          <input
            type="text"
            className="input-field"
            value={formData.meterNumber}
            onChange={(e) => handleChange('meterNumber', e.target.value)}
          />
        </FormField>

        <FormField label="Bill Date">
          <input
            type="date"
            className="input-field"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </FormField>

        <FormField label="Due Date">
          <input
            type="date"
            className="input-field"
            value={formData.dueDate}
            onChange={(e) => handleChange('dueDate', e.target.value)}
          />
        </FormField>

        <FormField label="Previous Reading">
          <input
            type="number"
            className="input-field"
            value={formData.previousReading}
            onChange={(e) => handleChange('previousReading', e.target.value)}
            min="0"
            step="0.01"
          />
        </FormField>

        <FormField label="Current Reading">
          <input
            type="number"
            className="input-field"
            value={formData.currentReading}
            onChange={(e) => handleChange('currentReading', e.target.value)}
            min="0"
            step="0.01"
          />
        </FormField>

        <FormField label="Consumption (kWh)">
          <input
            type="number"
            className="input-field !bg-slate-100"
            value={formData.consumption}
            readOnly
            disabled
            title="Auto-calculated from readings"
          />
          <p className="text-xs text-slate-400 mt-1">Auto-calculated</p>
        </FormField>

        <FormField label="Alert Threshold (kWh)">
          <input
            type="number"
            className="input-field"
            value={formData.alertThreshold}
            onChange={(e) => handleChange('alertThreshold', e.target.value)}
            min="0"
            step="0.01"
            placeholder="Set alert threshold for high consumption"
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
        submitText={initialData ? "Update Electricity" : "Add Electricity"}
        isEdit={!!initialData}
      />
    </form>
  );
};

export default ElectricityForm;