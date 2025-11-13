import React from 'react';
import { getRowColorClass } from '../../utils/styleUtils';
import { formatDate, calculateRemainingDays } from '../../utils/dateUtils';

const InsuranceTable = ({ data, onEdit, onDelete }) => {
  const getExpiryDate = (record) => {
    const expiryDate = record.policyEndDate;
    if (!expiryDate || expiryDate === 'N/A') return null;
    return new Date(expiryDate);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Plate Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Insurance Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Policy Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Policy Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Policy Start Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Policy End Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Insurance Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Policy Holder
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Days Until Expiry
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                No insurance records found
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
                    {record.insuranceCompanyName || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.mainPolicyNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.policyStatus || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.policyStartDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.policyEndDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.insuranceType || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.policyHolderName || '-'}
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
    </div>
  );
};

export default InsuranceTable;
