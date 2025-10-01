import React from 'react';
import { getRowColorClass } from '../../utils/styleUtils';
import { getExpiryStatus } from '../../utils/dateUtils';
import ExpiryIndicator from '../common/ExpiryIndicator';
import StatusBadge from '../common/StatusBadge';
import ActionButtons from '../common/ActionButtons';

const HomeRentsTable = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
    <table className="w-full min-w-[800px]">
      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-semibold">Property Name</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">District</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Contract No.</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Next Payment</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Annual Rent</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((rent) => {
          const rowClass = getRowColorClass(rent, 'homeRent');
          const payments = [
            { date: rent.firstPaymentDate, name: 'First' },
            { date: rent.secondPaymentDate, name: 'Second' },
            { date: rent.thirdPaymentDate, name: 'Third' },
            { date: rent.fourthPaymentDate, name: 'Fourth' }
          ];

          const nextPayment = payments.find(p => getExpiryStatus(p.date) !== 'expired') || payments[payments.length - 1];

          return (
            <tr key={rent.id} className={`border-b ${rowClass} hover:bg-gray-50 transition`}>
              <td className="px-4 py-3 text-sm">{rent.name}</td>
              <td className="px-4 py-3 text-sm">{rent.location}</td>
              <td className="px-4 py-3 text-sm">{rent.district}</td>
              <td className="px-4 py-3 text-sm">{rent.contractNumber}</td>
              <td className="px-4 py-3 text-sm">
                <ExpiryIndicator date={nextPayment.date} /> ({nextPayment.name})
              </td>
              <td className="px-4 py-3 text-sm">{rent.rentAnnually} SAR</td>
              <td className="px-4 py-3 text-sm">
                <StatusBadge status={rent.contractStatus} />
              </td>
              <td className="px-4 py-3 text-sm">
                <ActionButtons
                  onEdit={() => onEdit(rent)}
                  onDelete={() => onDelete(rent.id)}
                  attachments={rent.attachments}
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

export default HomeRentsTable;
