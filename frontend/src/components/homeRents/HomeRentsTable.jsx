import React from 'react';
import ActionButtons from '../common/ActionButtons';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const HomeRentsTable = ({ data = [], onEdit, onDelete }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
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

  const formatCurrency = (value) => {
    const amount = Number(value);
    if (isNaN(amount)) return 'SAR 0.00';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatRemainingDays = (days) => {
    if (days === null || isNaN(days)) return <span className="text-slate-400">-</span>;
    if (days < 0) return <span className="badge-danger">Expired</span>;
    if (days === 0) return <span className="badge-warning">Expires today</span>;
    if (days <= 30) return <span className="badge-warning">{days} days left</span>;
    return <span className="text-emerald-600 font-medium">{days} days left</span>;
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="badge-success">Paid</span>;
      case 'Pending':
        return <span className="badge-warning">Pending</span>;
      default:
        return <span className="badge-danger">{status || 'Unpaid'}</span>;
    }
  };

  return (
    <ScrollableTableWrapper>
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left">Contract Number</th>
              <th className="table-cell text-left">Start Date</th>
              <th className="table-cell text-left">End Date</th>
              <th className="table-cell text-left">Notice</th>
              <th className="table-cell text-left">Remaining</th>
              <th className="table-cell text-left">Payment Terms</th>
              <th className="table-cell text-left">Type</th>
              <th className="table-cell text-left">Status</th>
              <th className="table-cell text-right">Amount</th>
              <th className="table-cell text-right">Annual Rent</th>
              <th className="table-cell text-left">Address</th>
              <th className="table-cell text-left">Contact Person</th>
              <th className="table-cell text-left">GTS Contact</th>
              <th className="table-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="14" className="px-4 py-12 text-center">
                  <div className="text-slate-400 text-sm">No home rent records found</div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const remainingDays = getRemainingDays(item.contractEndingDate);
                const rowBg = remainingDays !== null && remainingDays < 0
                  ? 'bg-rose-50/60 border-l-[3px] border-rose-400'
                  : remainingDays !== null && remainingDays <= 10
                  ? 'bg-amber-50/60 border-l-[3px] border-amber-400'
                  : 'border-l-[3px] border-transparent';

                return (
                  <tr key={item._id} className={`table-row ${rowBg}`}>
                    <td className="table-cell whitespace-nowrap font-medium text-slate-800">
                      {item.contractNumber || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap text-slate-500">
                      {formatDate(item.contractStartingDate)}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {formatDate(item.contractEndingDate)}
                    </td>
                    <td className="table-cell">
                      {item.notice || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {formatRemainingDays(remainingDays)}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {item.paymentTerms || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {item.paymentType || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {getPaymentBadge(item.paymentStatus)}
                    </td>
                    <td className="table-cell whitespace-nowrap text-right font-medium text-slate-800">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="table-cell whitespace-nowrap text-right font-medium text-slate-800">
                      {formatCurrency(item.rentAnnually)}
                    </td>
                    <td className="table-cell">
                      <div className="min-w-[300px] max-w-lg whitespace-normal break-words text-slate-600">
                        {item.address || '-'}
                      </div>
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {item.contactPerson || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap">
                      {item.gtsContact || '-'}
                    </td>
                    <td className="table-cell whitespace-nowrap text-center">
                      <ActionButtons
                        onEdit={() => onEdit(item)}
                        onDelete={() => onDelete(item._id)}
                        attachments={item.attachments}
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

export default HomeRentsTable;
