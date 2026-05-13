import React from 'react';
import { getRowColorClass } from '../../utils/styleUtils';
import { formatDate, calculateRemainingDays } from '../../utils/dateUtils';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const AbsherTable = ({ data, onEdit, onDelete }) => {
  const getEarliestExpiry = (record) => {
    const expiryDate = record.registrationExpiryDate || record.renewalExpiryDate;
    if (!expiryDate || expiryDate === 'N/A') return null;
    return new Date(expiryDate);
  };

  const formatPlateInfo = (plateInfo) => {
    if (!plateInfo || plateInfo === '-') return '-';
    const parts = plateInfo.split('_');
    const lettersPart = parts[0] || '';
    const numberPart = parts[1] || '';

    if (lettersPart && /[\u0600-\u06FF]/.test(lettersPart)) {
      const separated = lettersPart.split('').join(' ');
      return `${separated} ${numberPart}`;
    }
    return `${lettersPart} ${numberPart}`;
  };

  const getDaysDisplay = (days) => {
    if (days === null) return <span className="text-slate-400">-</span>;
    if (days < 0) return <span className="badge-danger">Expired</span>;
    if (days <= 30) return <span className="badge-warning">{days} days</span>;
    return <span className="badge-success">{days} days</span>;
  };

  return (
    <ScrollableTableWrapper>
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Seq #</th>
              <th className="table-cell text-left">Plate Info</th>
              <th className="table-cell text-left">Plate Type</th>
              <th className="table-cell text-left">Owner</th>
              <th className="table-cell text-left">Owner ID</th>
              <th className="table-cell text-left">Maker</th>
              <th className="table-cell text-left">Model</th>
              <th className="table-cell text-left">Year</th>
              <th className="table-cell text-left">Color</th>
              <th className="table-cell text-left">Created</th>
              <th className="table-cell text-left">Renewal Expiry</th>
              <th className="table-cell text-left">Driver ID</th>
              <th className="table-cell text-left">Driver Name</th>
              <th className="table-cell text-left">Operator ID</th>
              <th className="table-cell text-left">Branch</th>
              <th className="table-cell text-left">Expiry Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="16" className="px-4 py-12 text-center">
                  <div className="text-slate-400 text-sm">No Absher records found</div>
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const earliestExpiry = getEarliestExpiry(record);
                const rowClass = getRowColorClass(record, 'absher');
                const daysUntilExpiry = earliestExpiry ? calculateRemainingDays(earliestExpiry.toISOString().split('T')[0]) : null;
                const uniqueKey = record._id || `${record.plateInfo || record.plateNumber}_${record.sequenceNumber}_${index}`;

                return (
                  <tr key={uniqueKey} className={`table-row ${rowClass}`}>
                    <td className="table-cell whitespace-nowrap font-medium text-slate-800">
                      {record.sequenceNumber || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap font-medium text-slate-800" dir="rtl">
                      {formatPlateInfo(record.plateInfo || record.plateNumber)}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.plateType?.nameEn || record.plateTypeCode || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.ownerName || record.name || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {record.ownerIdNumber || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.maker || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.model || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {record.modelYear || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.majorColor || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {formatDate(record.createdDate)}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {formatDate(record.renewalExpiryDate || record.registrationExpiryDate || record.expiryDate)}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {record.actualDriverIdNumber || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.actualDriverName || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {record.operatorIdNumber || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {record.branchName?.en || record.branchName?.ar || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {getDaysDisplay(daysUntilExpiry)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ScrollableTableWrapper>
  );
};

export default AbsherTable;
