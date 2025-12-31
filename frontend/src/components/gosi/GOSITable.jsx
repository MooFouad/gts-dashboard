import React from 'react';
import { Trash2, User, Calendar, TrendingUp } from 'lucide-react';

const GOSITable = ({ data, onDelete }) => {

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate actual status based on current date
  const getActualStatus = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (item.engagementEndDate) {
      const endDate = new Date(item.engagementEndDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return 'terminated';
      }
    }

    if (item.engagementStartDate) {
      const startDate = new Date(item.engagementStartDate);
      startDate.setHours(0, 0, 0, 0);

      if (startDate <= today) {
        return 'active';
      }
    }

    return 'inactive';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 mb-2">No GOSI records found</p>
        <p className="text-sm text-gray-400">Import an Excel file with employee Iqama numbers to fetch data from GOSI</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const status = getActualStatus(item);

        return (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
          >
            <div className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left Side - Employee Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 truncate">
                      {item.name || item.nin}
                    </h3>
                    {item.nameAr && (
                      <p className="text-xs text-gray-600" dir="rtl">{item.nameAr}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      NIN: {item.nin}
                    </p>
                  </div>
                </div>

                {/* Center - Engagement Dates */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                      <Calendar size={12} />
                      <span>Start</span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">
                      {formatDate(item.engagementStartDate)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                      <Calendar size={12} />
                      <span>End</span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">
                      {item.engagementEndDate ? (
                        formatDate(item.engagementEndDate)
                      ) : (
                        <span className="text-green-600 text-xs">Ongoing</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Deduction Rates */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 min-w-[180px]">
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1.5">
                    <TrendingUp size={12} />
                    <span className="font-medium">Deduction</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Employer:</span>
                      <span className="font-bold text-green-600">
                        {item.totalEmployerContribution ? `${item.totalEmployerContribution}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Employee:</span>
                      <span className="font-bold text-blue-600">
                        {item.totalEmployeeContribution ? `${item.totalEmployeeContribution}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-300">
                      <span className="text-gray-700 font-medium">Total:</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {item.totalContribution ? `${item.totalContribution}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Delete */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(status)} uppercase tracking-wide`}>
                    {status}
                  </span>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700 group"
                    title="Delete record"
                  >
                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="text-xs text-gray-400">
                    {formatDate(item.lastSyncDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GOSITable;
