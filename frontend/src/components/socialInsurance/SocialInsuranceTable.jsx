import React from 'react';
import ActionButtons from '../common/ActionButtons';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const SocialInsuranceTable = ({ data, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const getDaysDisplay = (days) => {
    if (days === null || typeof days === 'undefined') return <span className="text-slate-400">-</span>;
    if (days < 0) return <span className="badge-danger">Expired {Math.abs(days)}d ago</span>;
    if (days === 0) return <span className="badge-warning">Expires today</span>;
    if (days <= 30) return <span className="badge-warning">{days} days</span>;
    if (days <= 90) return <span className="text-amber-600 font-medium">{days} days</span>;
    return <span className="text-emerald-600 font-medium">{days} days</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge-success"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>;
      case 'expiring-soon':
        return <span className="badge-warning"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Expiring Soon</span>;
      case 'expired':
        return <span className="badge-danger"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Expired</span>;
      default:
        return <span className="badge-neutral">{status || 'N/A'}</span>;
    }
  };

  return (
    <ScrollableTableWrapper>
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Name</th>
              <th className="table-cell text-left">ID Number</th>
              <th className="table-cell text-left">Division</th>
              <th className="table-cell text-left">Start Date</th>
              <th className="table-cell text-left">End Date</th>
              <th className="table-cell text-left">Remaining</th>
              <th className="table-cell text-left">Status</th>
              <th className="table-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <div className="text-slate-400 text-sm">No social insurance records found</div>
                  <div className="text-slate-400 text-xs mt-1">Click "Add New" to create one</div>
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr key={record._id} className="table-row">
                  <td className="table-cell whitespace-nowrap font-medium text-slate-800">
                    {record.name || '-'}
                  </td>
                  <td className="table-cell whitespace-nowrap text-slate-500">
                    {record.nin || '-'}
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    {record.division || '-'}
                  </td>
                  <td className="table-cell whitespace-nowrap text-slate-500">
                    {formatDate(record.startDate)}
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    {formatDate(record.endDate)}
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    {getDaysDisplay(record.remainingDays)}
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="table-cell whitespace-nowrap text-center">
                    <ActionButtons
                      onEdit={() => onEdit(record)}
                      onDelete={() => onDelete(record._id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ScrollableTableWrapper>
  );
};

export default SocialInsuranceTable;
