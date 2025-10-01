import React from 'react';
import { getExpiryStatus } from '../../utils/dateUtils';

const ExpiryIndicator = ({ date }) => {
const status = getExpiryStatus(date);

return (
<div className="flex items-center gap-2">
      {date}
      {status === 'expired' && <span className="text-red-600">⚠️</span>}
      {status === 'warning' && <span className="text-orange-600">⏰</span>}
</div>
);
};

export default ExpiryIndicator;