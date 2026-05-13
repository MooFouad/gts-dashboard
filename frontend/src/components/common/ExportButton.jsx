import React from 'react';
import { FileDown } from 'lucide-react';

const ExportButton = ({ onClick, label = "Export", isLoading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="btn-outline !text-xs disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FileDown size={15} />
      {isLoading ? 'Exporting...' : label}
    </button>
  );
};

export default ExportButton;
