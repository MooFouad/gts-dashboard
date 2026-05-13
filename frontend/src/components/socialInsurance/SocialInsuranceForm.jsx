import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';

const SocialInsuranceForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    nin: '',
    division: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        nin: initialData.nin || '',
        division: initialData.division || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation temporarily disabled - will be re-enabled later
    // Just check if end date is after start date if both are provided
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date must be after start date');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <FormField label="Employee Name">
          <input
            type="text"
            className="input-field"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter employee name"
          />
        </FormField>

        {/* ID Number */}
        <FormField label="ID Number (NIN/Iqama)">
          <input
            type="text"
            className="input-field"
            value={formData.nin}
            onChange={(e) => handleChange('nin', e.target.value)}
            placeholder="e.g., 1234567890"
          />
        </FormField>

        {/* Division */}
        <FormField label="Division/Department">
          <input
            type="text"
            className="input-field"
            value={formData.division}
            onChange={(e) => handleChange('division', e.target.value)}
            placeholder="e.g., IT Department"
          />
        </FormField>

        {/* Start Date */}
        <FormField label="Start Date">
          <input
            type="date"
            className="input-field"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </FormField>

        {/* End Date */}
        <FormField label="End Date">
          <input
            type="date"
            className="input-field"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </FormField>
      </div>

      {/* Notes - Full width */}
      <FormField label="Notes (Optional)">
        <textarea
          className="input-field"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes..."
          rows="3"
        />
      </FormField>

      <FormActions onCancel={onCancel} />
    </form>
  );
};

export default SocialInsuranceForm;
