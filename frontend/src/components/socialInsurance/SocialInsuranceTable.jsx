import React from 'react';
import ActionButtons from '../common/ActionButtons';

const SocialInsuranceTable = ({ data, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const getRemainingDaysColor = (days) => {
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 30) return 'text-orange-600 font-bold';
    if (days <= 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'expiring-soon': 'bg-yellow-100 text-yellow-800',
      'expired': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'N/A'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              ID Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Division
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Start Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              End Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Remaining Days
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                No social insurance records found. Click "Add New" to create one.
              </td>
            </tr>
          ) : (
            data.map((record) => {
              return (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {record.name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.nin || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.division || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.startDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.endDate)}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${getRemainingDaysColor(record.remainingDays)}`}>
                    {record.remainingDays !== null && record.remainingDays !== undefined
                      ? record.remainingDays > 0
                        ? `${record.remainingDays} days`
                        : record.remainingDays === 0
                        ? 'Expires today'
                        : `Expired ${Math.abs(record.remainingDays)} days ago`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <ActionButtons
                      onEdit={() => onEdit(record)}
                      onDelete={() => onDelete(record._id)}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SocialInsuranceTable;
