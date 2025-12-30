import React from 'react';
import { Car, Home, Zap, FileText, Shield, Building2, Settings, Info } from 'lucide-react';
// Commented out - No data available yet
// import { FileCheck, ClipboardCheck } from 'lucide-react';

const TabNavigation = ({
  activeTab,
  onTabChange,
  vehiclesCount,
  homeRentsCount,
  electricityCount,
  absherCount,
  socialInsuranceCount,
  gosiCount,
  insuranceCount,
  mvpiCount,
  onSettingsClick,
  onDiagnosticsClick
}) => {
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
      <div className="w-full px-2">
        <div className="flex items-center justify-between">
          <div className="flex overflow-x-auto gap-1 flex-1">
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
          <button
            onClick={() => handleTabChange('gosi')}
            className={tabClasses('gosi')}
          >
            <img src="/gosi-logo.png" alt="GOSI" className="w-5 h-5" />
            <span>GOSI ({gosiCount})</span>
          </button>
          </div>

          {/* Settings & Diagnostics Buttons */}
          <div className="flex gap-1 ml-2">
            <button
              onClick={onDiagnosticsClick}
              className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
              title="Diagnostics"
            >
              <Info size={18} />
            </button>
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;