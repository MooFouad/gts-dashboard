import React from 'react';

const FormField = ({ label, required, highlight, children }) => {
return (
<div>
      <label className={`block text-sm font-medium mb-1 ${highlight ? 'text-red-600' : ''}`}>
      {label}
      {required && '*'}
      </label>
      {children}
</div>
);
};

export default FormField;