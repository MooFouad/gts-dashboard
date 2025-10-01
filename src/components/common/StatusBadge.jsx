import React from 'react';

const StatusBadge = ({ status }) => {
return (
<span className={`px-1 sm:px-2 py-1 rounded text-xs ${
      status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
}`}>
      {status}
</span>
);
};

export default StatusBadge;