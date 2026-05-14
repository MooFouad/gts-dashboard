import React, { useState, useEffect } from 'react';
import FormField from '../common/FormField';
import FormActions from '../common/FormActions';
import AttachmentField from '../common/AttachmentField';

const HomeRentForm = ({ onSubmit, onCancel, initialData = null, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    contractNumber: '',
    contractStartingDate: '',
    contractEndingDate: '',
    notice: '',
    paymentTerms: '3 Installments',
    paymentType: 'cash',
    paymentStatus: 'Pending',
    amount: 0,
    rentAnnually: 0,
    address: '',
    contactPerson: '',
    gtsContact: '',
    comments: '',
    attachments: []
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log('Initial data received:', initialData);
      setFormData({
        contractNumber: initialData.contractNumber || '',
        contractStartingDate: formatDateForInput(initialData.contractStartingDate),
        contractEndingDate: formatDateForInput(initialData.contractEndingDate),
        notice: initialData.notice || '',
        paymentTerms: initialData.paymentTerms || '3 Installments',
        paymentType: initialData.paymentType || 'cash',
        paymentStatus: initialData.paymentStatus || 'Pending',
        amount: initialData.amount || 0,
        rentAnnually: initialData.rentAnnually || 0,
        address: initialData.address || '',
        contactPerson: initialData.contactPerson || '',
        gtsContact: initialData.gtsContact || '',
        comments: initialData.comments || '',
        attachments: initialData.attachments || []
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure proper data types
    const submissionData = {
      ...formData,
      amount: Number(formData.amount),
      rentAnnually: Number(formData.rentAnnually),
      // Ensure dates are in YYYY-MM-DD format
      contractStartingDate: formData.contractStartingDate,
      contractEndingDate: formData.contractEndingDate
    };
    
    console.log('Submitting form data:', submissionData);
    onSubmit(submissionData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contract Number" required>
          <input
            type="text"
            required
            className="input-field"
            value={formData.contractNumber}
            onChange={(e) => handleChange('contractNumber', e.target.value)}
            placeholder="e.g., 10241969076"
          />
        </FormField>

        <FormField label="Starting Date" required highlight>
          <input
            type="date"
            required
            className="input-field"
            value={formData.contractStartingDate}
            onChange={(e) => handleChange('contractStartingDate', e.target.value)}
          />
        </FormField>

        <FormField label="End Date" required highlight>
          <input
            type="date"
            required
            className="input-field"
            value={formData.contractEndingDate}
            onChange={(e) => handleChange('contractEndingDate', e.target.value)}
          />
        </FormField>

        <FormField label="Notice Period">
          <input
            type="text"
            className="input-field"
            placeholder="e.g., 60 days"
            value={formData.notice}
            onChange={(e) => handleChange('notice', e.target.value)}
          />
        </FormField>

        <FormField label="Payment Terms" required>
          <input
            type="text"
            required
            className="input-field"
            placeholder="e.g., 3 Installments"
            value={formData.paymentTerms}
            onChange={(e) => handleChange('paymentTerms', e.target.value)}
          />
        </FormField>

        <FormField label="Payment Type" required>
          <select
            required
            className="input-field"
            value={formData.paymentType}
            onChange={(e) => handleChange('paymentType', e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="bank transfer">Bank Transfer</option>
            <option value="check">Check</option>
          </select>
        </FormField>

        <FormField label="Payment Status" required>
          <select
            required
            className="input-field"
            value={formData.paymentStatus}
            onChange={(e) => handleChange('paymentStatus', e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </FormField>

        <FormField label="Amount (SAR)" required>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="input-field"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="4000"
          />
        </FormField>

        <FormField label="Annual Rent (SAR)" required>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="input-field"
            value={formData.rentAnnually}
            onChange={(e) => handleChange('rentAnnually', e.target.value)}
            placeholder="45000"
          />
        </FormField>

        <FormField label="Address" required className="sm:col-span-2">
          <textarea
            required
            className="input-field"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows="2"
            placeholder="Full property address"
          />
        </FormField>

        <FormField label="Contact Person" required>
          <input
            type="text"
            required
            className="input-field"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            placeholder="John Doe"
          />
        </FormField>

        <FormField label="GTS Contact" required>
          <input
            type="text"
            required
            className="input-field"
            value={formData.gtsContact}
            onChange={(e) => handleChange('gtsContact', e.target.value)}
            placeholder="+966550859388"
          />
        </FormField>

        <FormField label="Comments" className="sm:col-span-2">
          <textarea
            className="input-field"
            value={formData.comments}
            onChange={(e) => handleChange('comments', e.target.value)}
            rows="3"
            placeholder="Additional notes or comments"
          />
        </FormField>

        <FormField label="Documents & Attachments" className="sm:col-span-2">
          <AttachmentField
            attachments={formData.attachments}
            onChange={(attachments) => handleChange('attachments', attachments)}
          />
        </FormField>
      </div>

      <FormActions
        onCancel={onCancel}
        submitText={initialData ? "Update Contract" : "Add Contract"}
        isEdit={!!initialData}
        isSubmitting={isSubmitting}
      />
    </form>
  );
};

export default HomeRentForm;