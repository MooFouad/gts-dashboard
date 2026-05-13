import React from 'react';
import { User, Calendar, TrendingUp } from 'lucide-react';

const GOSITable = ({ data }) => {

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActualStatus = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (item.engagementEndDate) {
      const endDate = new Date(item.engagementEndDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today) return 'terminated';
    }

    if (item.engagementStartDate) {
      const startDate = new Date(item.engagementStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate <= today) return 'active';
    }

    return 'inactive';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge-success"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>;
      case 'terminated':
        return <span className="badge-danger"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Terminated</span>;
      default:
        return <span className="badge-neutral"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inactive</span>;
    }
  };

  if (data.length === 0) {
    return (
      <div className="card text-center py-12 px-4">
        <div className="text-slate-400 text-sm">No GOSI records found</div>
        <div className="text-slate-400 text-xs mt-1">Import an Excel file with employee Iqama numbers to fetch data from GOSI</div>
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
            className="card-hover overflow-hidden"
          >
            <div className="p-4">
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between gap-4">
                {/* Employee Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-lg flex items-center justify-center shadow-sm">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-800 truncate">
                      {item.name || item.nin}
                    </h3>
                    {item.nameAr && (
                      <p className="text-xs text-slate-500" dir="rtl">{item.nameAr}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      NIN: {item.nin}
                    </p>
                  </div>
                </div>

                {/* Engagement Dates */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                      <Calendar size={12} />
                      <span>Start</span>
                    </div>
                    <div className="font-semibold text-sm text-slate-700">
                      {formatDate(item.engagementStartDate)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
                      <Calendar size={12} />
                      <span>End</span>
                    </div>
                    <div className="font-semibold text-sm text-slate-700">
                      {item.engagementEndDate ? (
                        formatDate(item.engagementEndDate)
                      ) : (
                        <span className="text-emerald-600 text-xs badge-success">Ongoing</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deduction Rates */}
                <div className="bg-slate-50 rounded-lg p-3 min-w-[180px] border border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                    <TrendingUp size={12} />
                    <span className="font-medium">Deduction</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Employer:</span>
                      <span className="font-bold text-emerald-600">
                        {item.totalEmployerContribution ? `${item.totalEmployerContribution}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Employee:</span>
                      <span className="font-bold text-blue-600">
                        {item.totalEmployeeContribution ? `${item.totalEmployeeContribution}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="text-slate-600 font-medium">Total:</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {item.totalContribution ? `${item.totalContribution}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Sync Date */}
                <div className="flex items-center gap-3">
                  {getStatusBadge(status)}
                  <div className="text-xs text-slate-400">
                    {formatDate(item.lastSyncDate)}
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-navy-600 to-navy-800 rounded-lg flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800 break-words">
                        {item.name || item.nin}
                      </h3>
                      {item.nameAr && (
                        <p className="text-xs text-slate-500 break-words" dir="rtl">{item.nameAr}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(status)}
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <span className="font-medium">NIN:</span> {item.nin}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100">
                    <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                      <Calendar size={10} />
                      <span className="font-medium">Start</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {formatDate(item.engagementStartDate)}
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100">
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                      <Calendar size={10} />
                      <span className="font-medium">End</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {item.engagementEndDate ? (
                        formatDate(item.engagementEndDate)
                      ) : (
                        <span className="text-emerald-600">Ongoing</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-600 mb-2 font-medium">
                    <TrendingUp size={12} />
                    <span>Deduction Rates</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Employer:</span>
                      <span className="font-bold text-emerald-600">
                        {item.totalEmployerContribution ? `${item.totalEmployerContribution}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Employee:</span>
                      <span className="font-bold text-blue-600">
                        {item.totalEmployeeContribution ? `${item.totalEmployeeContribution}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold">Total:</span>
                      <span className="font-bold text-slate-800">
                        {item.totalContribution ? `${item.totalContribution}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {item.lastSyncDate && (
                  <div className="text-[10px] text-slate-400 text-right">
                    Last sync: {formatDate(item.lastSyncDate)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GOSITable;
