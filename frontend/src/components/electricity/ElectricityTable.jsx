import React from 'react';
import ActionButtons from '../common/ActionButtons';
import { getRowColorClass } from '../../utils/styleUtils';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const ElectricityTable = ({ data, onEdit, onDelete }) => {
  return (
    <ScrollableTableWrapper>
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">No.</th>
              <th className="table-cell text-left">Account</th>
              <th className="table-cell text-left">Name</th>
              <th className="table-cell text-left">City</th>
              <th className="table-cell text-left">Address</th>
              <th className="table-cell text-left">Project</th>
              <th className="table-cell text-left">Division</th>
              <th className="table-cell text-left">Meter Number</th>
              <th className="table-cell text-left">Date</th>
              <th className="table-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-12 text-center">
                  <div className="text-slate-400 text-sm">No electricity records found</div>
                </td>
              </tr>
            ) : (
              data.map((electricity) => {
                const rowClass = getRowColorClass(electricity, 'electricity');

                return (
                  <tr key={electricity._id} className={`table-row ${rowClass}`}>
                    <td className="table-cell whitespace-nowrap font-medium text-slate-800">
                      {electricity.no}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {electricity.account}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {electricity.name}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {electricity.city}
                    </td>
                    <td className="table-cell">
                      <div className="min-w-[200px] whitespace-normal break-words text-slate-600">
                        {electricity.address}
                      </div>
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {electricity.project}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {electricity.division}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {electricity.meterNumber}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {electricity.date}
                    </td>
                    <td className="table-cell whitespace-nowrap text-center">
                      <ActionButtons
                        onEdit={() => onEdit(electricity)}
                        onDelete={() => onDelete(electricity._id)}
                        attachments={electricity.attachments}
                      />
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

export default ElectricityTable;
