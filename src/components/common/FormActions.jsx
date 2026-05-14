import React from 'react';

const FormActions = ({ onCancel, submitText, isEdit }) => {
return (
<div className="flex gap-3 pt-4">
      <button type="submit"         className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            {isEdit ? 'Update' : submitText}
      </button>
      <button
      type="button"
      onClick={onCancel}
      className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
      >
            Cancel
      </button>
</div>
);
};

export default FormActions;