import React from 'react';
import { getRowColorClass } from '../../utils/styleUtils';
import ExpiryIndicator from '../common/ExpiryIndicator';
import StatusBadge from '../common/StatusBadge';
import ActionButtons from '../common/ActionButtons';

const VehiclesTable = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
    <table className="w-full min-w-[800px]">
      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-semibold">Plate Number</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">License Expiry</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Inspection Expiry</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Driver</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((vehicle) => {
          const rowClass = getRowColorClass(vehicle, 'vehicle');
          
          return (
            <tr key={vehicle.id} className={`border-b ${rowClass} hover:bg-gray-50 transition`}>
              <td className="px-4 py-3 text-sm">{vehicle.plateNumber}</td>
              <td className="px-4 py-3 text-sm">{vehicle.vehicleMaker}</td>
              <td className="px-4 py-3 text-sm">{vehicle.vehicleModel}</td>
              <td className="px-4 py-3 text-sm">{vehicle.modelYear}</td>
              <td className="px-4 py-3 text-sm">
                <ExpiryIndicator date={vehicle.licenseExpiryDate} />
              </td>
              <td className="px-4 py-3 text-sm">
                <ExpiryIndicator date={vehicle.inspectionExpiryDate} />
              </td>
              <td className="px-4 py-3 text-sm">{vehicle.actualDriverName}</td>
              <td className="px-4 py-3 text-sm">
                <StatusBadge status={vehicle.vehicleStatus} />
              </td>
              <td className="px-4 py-3 text-sm">
                <ActionButtons
                  onEdit={() => onEdit(vehicle)}
                  onDelete={() => onDelete(vehicle.id)}
                  attachments={vehicle.attachments}
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

export default VehiclesTable;