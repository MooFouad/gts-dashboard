import React from 'react';
import Toolbar from './Toolbar';

const DataSection = ({ title, onAdd, addButtonText, children, searchTerm, onSearchChange, filterStatus, onFilterChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {addButtonText}
        </button>
      </div>

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        filterStatus={filterStatus}
        onFilterChange={onFilterChange}
      />

      {children}
    </div>
  );
};

export default DataSection;