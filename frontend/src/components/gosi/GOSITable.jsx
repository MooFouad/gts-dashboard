import React from 'react';
import { Trash2 } from 'lucide-react';

const GOSITable = ({ data, onDelete }) => {
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'SAR') => {
    if (!amount) return '-';
    return `${Number(amount).toLocaleString()} ${currency}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 mb-2">No GOSI records found</p>
        <p className="text-sm text-gray-400">Click "Sync from GOSI" to fetch employee data</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NIN / Iqama
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Occupation
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Wage
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Engagement Period
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employer Contrib.
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee Contrib.
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Contrib.
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Sync
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.nin}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.name || '-'}</div>
                {item.nameAr && (
                  <div className="text-sm text-gray-500" dir="rtl">{item.nameAr}</div>
                )}
                {item.contributorType && (
                  <div className="text-xs text-gray-400">{item.contributorType}</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{item.occupation || '-'}</div>
                {item.occupationCode && (
                  <div className="text-xs text-gray-500">Code: {item.occupationCode}</div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.wage, item.currency)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                <div className="text-xs text-gray-500">From:</div>
                <div>{formatDate(item.engagementStartDate)}</div>
                <div className="text-xs text-gray-500 mt-1">To:</div>
                <div>{formatDate(item.engagementEndDate)}</div>
                {item.daysUntilEnd !== null && item.daysUntilEnd !== undefined && (
                  <div className={`text-xs mt-1 ${item.daysUntilEnd < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.daysUntilEnd < 0 ? `Ended ${Math.abs(item.daysUntilEnd)} days ago` : `${item.daysUntilEnd} days left`}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.totalEmployerContribution, item.currency)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.totalEmployeeContribution, item.currency)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                {formatCurrency(item.totalContribution, item.currency)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.lastSyncDate)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={() => onDelete(item._id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Products Details Section (Optional - can be expanded) */}
      {data.length > 0 && data.some(item => item.products && item.products.length > 0) && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-500">
            💡 Products/subscriptions data is stored in fullApiResponse field. Click on a record to view details.
          </p>
        </div>
      )}
    </div>
  );
};

export default GOSITable;
