import React from 'react';
import { X } from 'lucide-react';

const FormDialog = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-modal p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-3 sm:m-0 animate-slide-down">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default FormDialog;
