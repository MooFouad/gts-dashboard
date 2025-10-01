import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConsumptionAlert = ({ current, threshold, lastMonth }) => {
  const isOverThreshold = current > threshold;
  const increasedFromLastMonth = lastMonth && current > lastMonth;
  
  if (!isOverThreshold && !increasedFromLastMonth) return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${isOverThreshold ? 'text-red-600' : 'text-yellow-600'}`}>
      <AlertTriangle size={16} />
      <span>
        {isOverThreshold && `Consumption over threshold (${threshold} kWh)`}
        {!isOverThreshold && increasedFromLastMonth && 
          `Increased from last month (${lastMonth} kWh)`}
      </span>
    </div>
  );
};

export default ConsumptionAlert;