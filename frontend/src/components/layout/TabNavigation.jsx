import React from 'react';
import { Car, Home, Zap, FileText, Shield, Building2 } from 'lucide-react';
// Commented out - No data available yet
// import { FileCheck, ClipboardCheck } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, vehiclesCount, homeRentsCount, electricityCount, absherCount, socialInsuranceCount, gosiCount, insuranceCount, mvpiCount }) => {
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
          {/* replaced by Tamm */}
          {/* <button
            onClick={() => handleTabChange('vehicles')}
            className={tabClasses('vehicles')}
          >
            <Car size={20} />
            <span className="capitalize">Vehicles ({vehiclesCount})</span>
          </button> */}
          <button
            onClick={() => handleTabChange('absher')}
            className={tabClasses('absher')}
          >
            <Car size={20} />
            <span>Tamm - Istemarah ({absherCount})</span>
          </button>

          {/* Commented out - No data available yet */}
          {/* <button
            onClick={() => handleTabChange('insurance')}
            className={tabClasses('insurance')}
          >
            <FileCheck size={20} />
            <span>Tamm - Insurance ({insuranceCount})</span>
          </button>

          <button
            onClick={() => handleTabChange('mvpi')}
            className={tabClasses('mvpi')}
          >
            <ClipboardCheck size={20} />
            <span>Tamm - MVPI ({mvpiCount})</span>
          </button> */}

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
            onClick={() => handleTabChange('socialInsurance')}
            className={tabClasses('socialInsurance')}
          >
            <Shield size={20} />
            <span>Social Insurance ({socialInsuranceCount})</span>
          </button>
          {/* <button
            onClick={() => handleTabChange('gosi')}
            className={tabClasses('gosi')}
          >
            <Building2 size={20} />
            <span>GOSI ({gosiCount})</span>
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;