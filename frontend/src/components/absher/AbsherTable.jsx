import React from 'react';
import ActionButtons from '../common/ActionButtons';
import ExpiryIndicator from '../common/ExpiryIndicator';
import { getRowColorClass } from '../../utils/styleUtils';
import { formatDate, calculateRemainingDays } from '../../utils/dateUtils';

const AbsherTable = ({ data, onEdit, onDelete }) => {
  const getEarliestExpiry = (record) => {
    // Only registration expiry is available from Istemarah Renewal API
    const expiryDate = record.registrationExpiryDate || record.renewalExpiryDate;

    if (!expiryDate || expiryDate === 'N/A') return null;

    return new Date(expiryDate);
  };

  // Format plateInfo from "ببأ_7562_1" to "ب ب أ 7562"
  const formatPlateInfo = (plateInfo) => {
    if (!plateInfo || plateInfo === '-') return '-';

    // Split by underscores
    const parts = plateInfo.split('_');

    // We only want the first two parts (letters and number, not the trailing type code)
    const lettersPart = parts[0] || '';
    const numberPart = parts[1] || '';

    // Separate Arabic letters with spaces
    if (lettersPart && /[\u0600-\u06FF]/.test(lettersPart)) {
      const separated = lettersPart.split('').join(' ');
      return `${separated} ${numberPart}`;
    }

    // If no Arabic letters, just join with space
    return `${lettersPart} ${numberPart}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Sequence Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Plate Info
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Plate Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Owner Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Owner ID Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Maker
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Model
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Model Year
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Major Color
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Created Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Renewal Expiry Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Actual Driver ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Actual Driver Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Operator ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Branch Name
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
              <td colSpan="17" className="px-4 py-8 text-center text-gray-500">
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
                    {record.sequenceNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatPlateInfo(record.plateInfo || record.plateNumber)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.plateType?.nameEn || record.plateTypeCode || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.ownerName || record.name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.ownerIdNumber || '-'}
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
                    {record.majorColor || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.createdDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {formatDate(record.renewalExpiryDate || record.registrationExpiryDate || record.expiryDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.actualDriverIdNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.actualDriverName || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.operatorIdNumber || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {record.branchName?.en || record.branchName?.ar || '-'}
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
