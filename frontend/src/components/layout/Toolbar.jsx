import React from 'react';
import { Search, Plus } from 'lucide-react';
import StatusLegend from '../common/StatusLegend';

const Toolbar = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  totalItems,
  onCreate,
  actionButtons,
  statusOptions,
  searchPlaceholder = "Search...",
  showLegend = true
}) => {
  return (
    <div className="card p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="input-field !pl-9 !rounded-full !text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter */}
        <select
          className="input-field !w-auto !rounded-full !text-sm !py-2.5 !px-4 !pr-8"
          value={filterStatus}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {statusOptions ? (
            statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          ) : (
            <>
              <option value="all">All Status</option>
              <option value="expired">Expired</option>
              <option value="warning">Needs Renewal</option>
              <option value="valid">Valid</option>
            </>
          )}
        </select>

        {/* Action buttons */}
        {(onCreate || actionButtons) && (
          <div className="flex gap-2">
            {onCreate && (
              <button onClick={onCreate} className="btn-primary !text-sm">
                <Plus size={16} />
                Add New
              </button>
            )}
            {actionButtons}
          </div>
        )}

        {/* Legend & count */}
        <div className="flex items-center gap-4 ml-auto">
          {showLegend && <StatusLegend />}
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {totalItems} records
          </span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
