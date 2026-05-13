import React from 'react';

const StatusLegend = () => {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        <span>Expired</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        <span>Warning</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>Valid</span>
      </div>
    </div>
  );
};

export default StatusLegend;
