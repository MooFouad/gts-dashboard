import React from 'react';
import StatusBadge from '../common/StatusBadge';
import ActionButtons from '../common/ActionButtons';
import { getRowColorClass } from '../../utils/styleUtils';

const ElectricityTable = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="min-w-full">
      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-semibold">Department No.</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Meter No.</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Last Reading</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Consumption</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Bill Amount</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Due Date</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((electricity) => {
          const rowClass = getRowColorClass(electricity, 'electricity');
          
          return (
            <tr key={electricity.id} className={`border-b ${rowClass} hover:bg-gray-50 transition`}>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.departmentNumber}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.meterNumber}</td>
              <td className="px-4 py-3 text-sm">{electricity.location}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.lastReadingDate}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span>{electricity.consumption} kWh</span>
                  {electricity.alertThreshold && electricity.consumption > electricity.alertThreshold && (
                    <span className="text-red-500 text-xs font-medium">High Usage</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.billAmount} SAR</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">{electricity.dueDate}</td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                <StatusBadge status={electricity.paymentStatus} />
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap">
                <ActionButtons
                  onEdit={() => onEdit(electricity)}
                  onDelete={() => onDelete(electricity.id)}
                  attachments={electricity.attachments}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
};

export default ElectricityTable;