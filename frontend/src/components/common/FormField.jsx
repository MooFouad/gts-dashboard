import React from 'react';

const FormField = ({ label, required, highlight, children }) => {
  return (
    <div>
      <label className={`input-label ${highlight ? 'text-rose-600' : ''}`}>
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
};

export default FormField;
