import React from 'react';
import { getRowColorClass } from '../../utils/styleUtils';
import { formatDate, calculateRemainingDays } from '../../utils/dateUtils';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const MVPITable = ({ data, onEdit, onDelete }) => {
  const getExpiryDate = (record) => {
    const expiryDate = record.inspectionExpiryDate;
    if (!expiryDate || expiryDate === 'N/A') return null;
    return new Date(expiryDate);
  };

  return (
    <ScrollableTableWrapper>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Plate Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Inspection Report #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Inspection Center
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Inspection Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Expiry Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Result
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Maker
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Model
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Year
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Odometer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Days Until Expiry
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                No MVPI records found
              </td>
            </tr>
          ) : (
            data.map((record) => {
              const expiryDate = getExpiryDate(record);
              const remainingDays = expiryDate ? calculateRemainingDays(expiryDate) : null;
              const rowColorClass = remainingDays !== null ? getRowColorClass(remainingDays) : '';

              return (
                <tr key={record._id} className={rowColorClass}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.plateNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.inspectionReportNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.inspectionCenterName || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.inspectionDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.inspectionExpiryDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.inspectionResult || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.inspectionStatus || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.maker || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.model || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.modelYear || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.odometerReading ? `${record.odometerReading} km` : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                    {remainingDays !== null ? (
                      <>
                        {remainingDays > 0 ? (
                          <span>{remainingDays} days</span>
                        ) : (
                          <span className="text-red-600">Expired {Math.abs(remainingDays)} days ago</span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </ScrollableTableWrapper>
  );
};

export default MVPITable;
