import React from 'react';
import { Car, Home, Zap, FileText, Shield } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, vehiclesCount, homeRentsCount, electricityCount, absherCount, socialInsuranceCount }) => {
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      onTabChange(tab);
    }
  };

  const tabClasses = (tab) =>
    `flex items-center gap-2 px-4 sm:px-6 py-3 font-medium transition duration-200 rounded-t-lg ${
      activeTab === tab
        ? 'bg-white text-blue-600 shadow-sm border-t-2 border-blue-600'
        : 'text-gray-600 hover:text-blue-600 hover:bg-white/60'
    }`;

  return (
    <div className="border-b overflow-x-auto bg-gray-50 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap sm:flex-nowrap min-w-max sm:min-w-0 gap-2 sm:gap-4">
          <button
            onClick={() => handleTabChange('vehicles')}
            className={tabClasses('vehicles')}
          >
            <Car size={20} />
            <span className="capitalize">Vehicles ({vehiclesCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('homeRents')}
            className={tabClasses('homeRents')}
          >
            <Home size={20} />
            <span>Home Rents ({homeRentsCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('electricity')}
            className={tabClasses('electricity')}
          >
            <Zap size={20} />
            <span>Electricity ({electricityCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('absher')}
            className={tabClasses('absher')}
          >
            <FileText size={20} />
            <span>Absher ({absherCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('socialInsurance')}
            className={tabClasses('socialInsurance')}
          >
            <Shield size={20} />
            <span>Social Insurance ({socialInsuranceCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;