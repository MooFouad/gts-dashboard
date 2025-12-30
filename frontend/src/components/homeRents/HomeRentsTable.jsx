import React from 'react';
import ActionButtons from '../common/ActionButtons';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const HomeRentsTable = ({ data = [], onEdit, onDelete }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(date);
    } catch {
      return 'Invalid Date';
    }
  };

  const calculateRemainingDays = (endDateStr) => {
    if (!endDateStr) return null;
    
    try {
      const [year, month, day] = endDateStr.split('-').map(Number);
      const endDate = new Date(year, month - 1, day); // month is 0-based
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(endDate.getTime())) {
        console.error('Invalid end date:', endDateStr);
        return null;
      }

      const diffTime = endDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating remaining days:', error);
      return null;
    }
  };

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (isNaN(amount)) return 'SAR 0.00';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getRowClass = (item) => {
    const remainingDays = calculateRemainingDays(item.contractEndingDate);
    if (remainingDays === null) return 'bg-white';
    if (remainingDays < 0) return 'bg-red-100 border-l-4 border-red-500';
    if (remainingDays <= 10) return 'bg-yellow-100 border-l-4 border-orange-500';
    return 'bg-white border-l-4 border-transparent';
  };

  const getRemainingDaysDisplay = (item) => {
    const days = item.remainingDays;
    
    if (days === null || typeof days === 'undefined') return 'Invalid date';
    
    const textColor = days < 0 ? 'text-red-600' : 
                     days <= 30 ? 'text-orange-600' : 
                     'text-green-600';
                     
    const text = days < 0 ? `Expired ${Math.abs(days)} days ago` :
                 `${days} days remaining`;
                 
    return <span className={`font-medium ${textColor}`}>{text}</span>;
  };

  const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatRemainingDays = (days) => {
    if (days === null || isNaN(days)) return 'Invalid date';
    if (days < 0) return <span className="text-red-600 font-medium">Expired</span>;
    if (days === 0) return <span className="text-orange-600 font-medium">Expires today</span>;
    if (days <= 30) return <span className="text-orange-600 font-medium">{days} days left</span>;
    return <span className="text-green-600">{days} days left</span>;
  };

  return (
    <ScrollableTableWrapper className="shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract Number</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starting Date</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notice</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining Days</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Rent</th>
              <th className="w-96 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GTS Contact</th>
              <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => {
              const remainingDays = getRemainingDays(item.contractEndingDate);
              
              return (
                <tr key={item._id} className={`hover:bg-gray-50`}>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate">
                    {item.contractNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                    {formatDate(item.contractStartingDate)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                    {formatDate(item.contractEndingDate)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {item.notice || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {formatRemainingDays(remainingDays)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate">
                    {item.paymentTerms || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {item.paymentType || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : item.paymentStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.paymentStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {formatCurrency(item.rentAnnually)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <div className="min-w-[384px] max-w-lg whitespace-normal break-words">
                      {item.address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate">
                    {item.contactPerson || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate">
                    {item.gtsContact || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-center">
                    <ActionButtons
                      onEdit={() => onEdit(item)}
                      onDelete={() => onDelete(item._id)}
                      attachments={item.attachments}
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

export default HomeRentsTable;