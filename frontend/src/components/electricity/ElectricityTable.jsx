import React from 'react';
import ActionButtons from '../common/ActionButtons';
import { getRowColorClass } from '../../utils/styleUtils';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const ElectricityTable = ({ data, onEdit, onDelete }) => {
  return (
    <ScrollableTableWrapper className="-mx-2 sm:mx-0">
      <table className="min-w-full">
      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-semibold">No.</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Account</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">City</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Project</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Division</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Meter Number</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((electricity) => {
          const rowClass = getRowColorClass(electricity, 'electricity');

          return (
            <tr key={electricity._id} className={`border-b ${rowClass} hover:bg-gray-50 transition`}>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.no}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.account}</td>
              <td className="px-4 py-3 text-sm">{electricity.name}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.city}</td>
              <td className="px-4 py-3 text-sm">{electricity.address}</td>
              <td className="px-4 py-3 text-sm">{electricity.project}</td>
              <td className="px-4 py-3 text-sm">{electricity.division}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.meterNumber}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.date}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                <ActionButtons
                  onEdit={() => onEdit(electricity)}
                  onDelete={() => onDelete(electricity._id)}
                  attachments={electricity.attachments}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </ScrollableTableWrapper>
  );
};

export default ElectricityTable;