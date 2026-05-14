import React from 'react';
import { Car, Home, Zap } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, vehiclesCount, homeRentsCount, electricityCount }) => {
return (
<div className="border-b overflow-x-auto">
      <div className="flex flex-wrap sm:flex-nowrap min-w-max sm:min-w-0">
      <button
      onClick={() => onTabChange('vehicles')}
      className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
            activeTab === 'vehicles'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      >
      <Car size={20} />
      vehicles ({vehiclesCount})
      </button>
      <button
      onClick={() => onTabChange('homeRents')}
      className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
            activeTab === 'homeRents'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      >
      <Home size={20} />
      Home Rents ({homeRentsCount})
      </button>
      <button
      onClick={() => onTabChange('electricity')}
      className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
            activeTab === 'electricity'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      >
      <Zap size={20} />
      Electricity ({electricityCount})
      </button>
      </div>
</div>
);
};

export default TabNavigation;