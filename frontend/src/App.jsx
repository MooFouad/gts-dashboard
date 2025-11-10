import React, { useState, useEffect } from 'react';
import { Settings, Info } from 'lucide-react';
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import StatusLegend from './components/common/StatusLegend';
import VehiclesContainer from './components/vehicles/VehiclesContainer';
import HomeRentsContainer from './components/homeRents/HomeRentsContainer';
import ElectricityContainer from './components/electricity/ElectricityContainer';
import AbsherContainer from './components/absher/AbsherContainer';
import SocialInsuranceContainer from './components/socialInsurance/SocialInsuranceContainer';
import { vehicleService, homeRentService, electricityService, socialInsuranceService, absherService } from './services';

// Lazy load notification components to prevent errors
const NotificationSettings = React.lazy(() =>
  import('./components/common/NotificationSettings').catch(() => ({
    default: () => <div>Notification Settings Not Available</div>
  }))
);

const NotificationDiagnostics = React.lazy(() =>
  import('./components/common/NotificationDiagnostics').catch(() => ({
    default: () => <div>Diagnostics Not Available</div>
  }))
);

const App = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [counts, setCounts] = useState({
    vehicles: 0,
    homeRents: 0,
    electricity: 0,
    absher: 0,
    socialInsurance: 0
  });

  useEffect(() => {
    // Fetch initial counts from API
    const fetchCounts = async () => {
      try {
        const [vehiclesCount, homeRentsCount, electricityCount, absherCount, socialInsuranceCount] = await Promise.all([
          vehicleService.getCount(),
          homeRentService.getCount(),
          electricityService.getCount(),
          absherService.getCount(),
          socialInsuranceService.getCount()
        ]);

        setCounts({
          vehicles: vehiclesCount.count,
          homeRents: homeRentsCount.count,
          electricity: electricityCount.count,
          absher: absherCount.count,
          socialInsurance: socialInsuranceCount.count
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();

    // Listen for count updates
    const handleCountUpdate = (event) => {
      const { type, count } = event.detail;
      setCounts(prevCounts => ({
        ...prevCounts,
        [type]: count
      }));
    };

    window.addEventListener('itemCountUpdate', handleCountUpdate);

    return () => {
      window.removeEventListener('itemCountUpdate', handleCountUpdate);
    };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full overflow-hidden">
      <Header />

      {/* Navigation with Settings and Diagnostics Buttons */}
      <div className="bg-gray-50 border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            vehiclesCount={counts.vehicles}
            homeRentsCount={counts.homeRents}
            electricityCount={counts.electricity}
            absherCount={counts.absher}
            socialInsuranceCount={counts.socialInsurance}
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowDiagnostics(!showDiagnostics);
                setShowSettings(false);
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
              title="Notification Diagnostics"
            >
              <Info size={20} />
            </button>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowDiagnostics(false);
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
              title="Notification Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <StatusLegend />

      {/* Notification Diagnostics Panel */}
      {showDiagnostics && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <React.Suspense fallback={<div className="text-center py-4">Loading...</div>}>
            <NotificationDiagnostics />
          </React.Suspense>
        </div>
      )}

      {/* Notification Settings Panel */}
      {showSettings && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <React.Suspense fallback={<div className="text-center py-4">Loading...</div>}>
            <NotificationSettings />
          </React.Suspense>
        </div>
      )}

      <div className="p-2 sm:p-4 overflow-x-auto">
        <div className={activeTab === 'vehicles' ? 'block' : 'hidden'}>
          <VehiclesContainer />
        </div>

        <div className={activeTab === 'homeRents' ? 'block' : 'hidden'}>
          <HomeRentsContainer />
        </div>

        <div className={activeTab === 'electricity' ? 'block' : 'hidden'}>
          <ElectricityContainer />
        </div>

        <div className={activeTab === 'absher' ? 'block' : 'hidden'}>
          <AbsherContainer />
        </div>

        <div className={activeTab === 'socialInsurance' ? 'block' : 'hidden'}>
          <SocialInsuranceContainer />
        </div>
      </div>
    </div>
  );
};

export default App;