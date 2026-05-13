import React from 'react';

const FormActions = ({ onCancel, submitText = 'Save', isEdit }) => {
  return (
    <div className="flex gap-3 pt-5 border-t border-slate-200 mt-2">
      <button type="submit" className="btn-primary">
        {isEdit ? 'Update' : submitText}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="btn-secondary"
      >
        Cancel
      </button>
    </div>
  );
};

export default FormActions;
