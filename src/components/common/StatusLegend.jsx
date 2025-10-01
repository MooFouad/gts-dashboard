import React from 'react';

const StatusLegend = () => {
return (
<div className="p-4 bg-yellow-50 border-b flex gap-4 items-center text-sm">
      <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-red-500 border-2 border-red-500 rounded"></div>
      <span>Expired</span>
      </div>
      <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-yellow-500 border-2 border-orange-500 rounded"></div>
      <span>Warning - 10 days or less</span>
      </div>
      <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
      <span>Valid</span>
      </div>
</div>
);
};

export default StatusLegend;