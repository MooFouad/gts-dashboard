import React from 'react';
import ActionButtons from '../common/ActionButtons';
import ExpiryIndicator from '../common/ExpiryIndicator';
import { getRowColorClass } from '../../utils/styleUtils';
import { formatDate, calculateRemainingDays } from '../../utils/dateUtils';

const AbsherTable = ({ data, onEdit, onDelete }) => {
  const getEarliestExpiry = (record) => {
    const dates = [
      record.expiryDate,
      record.inspectionExpiryDate,
      record.licenseExpiryDate
    ].filter(date => date);

    if (dates.length === 0) return null;

    return new Date(Math.min(...dates.map(d => new Date(d))));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Reference Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Plate Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Issue Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Registration Expiry
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Inspection Expiry
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              License Expiry
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Days Until Expiry
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                No Absher records found
              </td>
            </tr>
          ) : (
            data.map((record) => {
              const earliestExpiry = getEarliestExpiry(record);
              const rowClass = getRowColorClass(record, 'absher');
              const daysUntilExpiry = earliestExpiry ? calculateRemainingDays(earliestExpiry.toISOString().split('T')[0]) : null;

              return (
                <tr key={record._id} className={rowClass}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.referenceNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.plateNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.issueDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.expiryDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.inspectionExpiryDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.licenseExpiryDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {daysUntilExpiry !== null ? (
                      daysUntilExpiry < 0 ? (
                        <span className="text-red-600">Expired</span>
                      ) : (
                        <span className={daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-green-600'}>
                          {daysUntilExpiry} days
                        </span>
                      )
                    ) : '-'}
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

export default AbsherTable;
