import React from 'react';
import { getRowColorClass } from '../../utils/styleUtils';
import ExpiryIndicator from '../common/ExpiryIndicator';
import StatusBadge from '../common/StatusBadge';
import ActionButtons from '../common/ActionButtons';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const VehiclesTable = ({ data, onEdit, onDelete }) => {
  return (
    <ScrollableTableWrapper className="-mx-2 sm:mx-0">
    <table className="w-full min-w-[2000px]">
      <thead className="bg-gray-100 border-b">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-semibold sticky left-0 bg-gray-100 z-10">1. Plate Number</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">2. Registration Type</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">3. Brand</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">4. Model</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">5. Year of Manufacture</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">6. Serial Number</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">7. Chassis Number</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">8. Basic Color</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">9. License Expiry Date</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">10. Inspection Expiry Date</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">11. Actual User ID Number</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">12. Actual User Name</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">13. Inspection Status</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">14. Insurance Status</th>
          <th className="px-3 py-2 text-left text-xs font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((vehicle) => {
          const rowClass = getRowColorClass(vehicle, 'vehicle');

          return (
            <tr key={vehicle._id} className={`border-b ${rowClass} hover:bg-gray-50 transition`}>
              {/* 1. Plate Number */}
              <td className="px-3 py-2 text-xs sticky left-0 bg-white">{vehicle.plateNumber}</td>

              {/* 2. Registration Type */}
              <td className="px-3 py-2 text-xs">{vehicle.registrationType || '-'}</td>

              {/* 3. Brand */}
              <td className="px-3 py-2 text-xs">{vehicle.vehicleMaker || '-'}</td>

              {/* 4. Model */}
              <td className="px-3 py-2 text-xs">{vehicle.vehicleModel || '-'}</td>

              {/* 5. Year of Manufacture */}
              <td className="px-3 py-2 text-xs">{vehicle.modelYear || '-'}</td>

              {/* 6. Serial Number */}
              <td className="px-3 py-2 text-xs">{vehicle.sequenceNumber || '-'}</td>

              {/* 7. Chassis Number */}
              <td className="px-3 py-2 text-xs">{vehicle.chassisNumber || '-'}</td>

              {/* 8. Basic Color */}
              <td className="px-3 py-2 text-xs">{vehicle.basicColor || '-'}</td>

              {/* 9. License Expiry Date */}
              <td className="px-3 py-2 text-xs">
                <ExpiryIndicator date={vehicle.licenseExpiryDate} />
              </td>

              {/* 10. Inspection Expiry Date */}
              <td className="px-3 py-2 text-xs">
                <ExpiryIndicator date={vehicle.inspectionExpiryDate} />
              </td>

              {/* 11. Actual User ID Number */}
              <td className="px-3 py-2 text-xs">{vehicle.actualDriverId || '-'}</td>

              {/* 12. Actual User Name */}
              <td className="px-3 py-2 text-xs">{vehicle.actualDriverName || '-'}</td>

              {/* 13. Inspection Status */}
              <td className="px-3 py-2 text-xs">
                <StatusBadge status={vehicle.inspectionStatus} />
              </td>

              {/* 14. Insurance Status */}
              <td className="px-3 py-2 text-xs">
                <StatusBadge status={vehicle.insuranceStatus} />
              </td>

              {/* Actions */}
              <td className="px-3 py-2 text-xs">
                <ActionButtons
                  onEdit={() => onEdit(vehicle)}
                  onDelete={() => onDelete(vehicle._id)}
                  attachments={vehicle.attachments}
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

export default VehiclesTable;