import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'badge-success',
    active: 'badge-success',
    valid: 'badge-success',
    Paid: 'badge-success',
    warning: 'badge-warning',
    'expiring-soon': 'badge-warning',
    Pending: 'badge-warning',
    expired: 'badge-danger',
    Overdue: 'badge-danger',
    terminated: 'badge-danger',
    inactive: 'badge-neutral',
    Inactive: 'badge-neutral',
  };

  const dotColors = {
    Active: 'bg-emerald-500',
    active: 'bg-emerald-500',
    valid: 'bg-emerald-500',
    Paid: 'bg-emerald-500',
    warning: 'bg-amber-500',
    'expiring-soon': 'bg-amber-500',
    Pending: 'bg-amber-500',
    expired: 'bg-rose-500',
    Overdue: 'bg-rose-500',
    terminated: 'bg-rose-500',
    inactive: 'bg-slate-400',
    Inactive: 'bg-slate-400',
  };

  const badgeClass = styles[status] || 'badge-neutral';
  const dotColor = dotColors[status] || 'bg-slate-400';

  return (
    <span className={badgeClass}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
