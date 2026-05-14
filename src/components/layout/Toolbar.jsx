import React from 'react';
import { Search, Plus } from 'lucide-react';

const Toolbar = ({ searchTerm, onSearchChange, filterStatus, onFilterChange, totalItems }) => {
return (
<div className="p-2 sm:p-4 border-b bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
            <div className="text-sm text-gray-600">
                  Total Items: <span className="font-semibold">{totalItems}</span>
            </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pr-10 pl-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                  />
            </div>
            <select
                  className="border rounded-lg px-4 py-2 bg-white"
                  value={filterStatus}
                  onChange={(e) => onFilterChange(e.target.value)}
            >
                  <option value="all">All Status</option>
                  <option value="expired">Expired</option>
                  <option value="warning">Needs Renewal</option>
                  <option value="valid">Valid</option>
            </select>
      </div>
</div>
);
};

export default Toolbar;