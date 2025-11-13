import React, { useState, useEffect } from 'react';
import { Settings, Info } from 'lucide-react';
import Header from './components/layout/Header';
import TabNavigation from './components/layout/TabNavigation';
import StatusLegend from './components/common/StatusLegend';
import HomeRentsContainer from './components/homeRents/HomeRentsContainer';
import ElectricityContainer from './components/electricity/ElectricityContainer';
import AbsherContainer from './components/absher/AbsherContainer';
import SocialInsuranceContainer from './components/socialInsurance/SocialInsuranceContainer';
import GOSIContainer from './components/gosi/GOSIContainer';
// Commented out - No data available yet
// import VehiclesContainer from './components/vehicles/VehiclesContainer';
// import InsuranceContainer from './components/insurance/InsuranceContainer';
// import MVPIContainer from './components/mvpi/MVPIContainer';
import { vehicleService, homeRentService, electricityService, socialInsuranceService, absherService, gosiService } from './services';
// import { insuranceService, mvpiService } from './services';

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
  const [activeTab, setActiveTab] = useState('absher');
  const [showSettings, setShowSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [counts, setCounts] = useState({
    vehicles: 0,
    homeRents: 0,
    electricity: 0,
    absher: 0,
    socialInsurance: 0,
    gosi: 0,
    insurance: 0,
    mvpi: 0
  });

  useEffect(() => {
    // Fetch initial counts from API
    const fetchCounts = async () => {
      try {
        // Use Promise.allSettled to handle individual failures gracefully
        const results = await Promise.allSettled([
          vehicleService.getCount(),
          homeRentService.getCount(),
          electricityService.getCount(),
          absherService.getCount(),
          socialInsuranceService.getCount(),
          gosiService.getCount()
          // insuranceService.getCount(),
          // mvpiService.getCount()
        ]);

        // Extract counts, defaulting to 0 if failed
        // API service returns JSON directly (not wrapped like axios)
        const [vehiclesCount, homeRentsCount, electricityCount, absherCount, socialInsuranceCount, gosiCount] = results.map(
          result => result.status === 'fulfilled' ? result.value : { count: 0 }
        );

        setCounts({
          vehicles: vehiclesCount.count || 0,
          homeRents: homeRentsCount.count || 0,
          electricity: electricityCount.count || 0,
          absher: absherCount.count || 0,
          socialInsurance: socialInsuranceCount.count || 0,
          gosi: gosiCount.count || 0,
          insurance: 0, // insuranceCount.count,
          mvpi: 0 // mvpiCount.count
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
            gosiCount={counts.gosi}
            insuranceCount={counts.insurance}
            mvpiCount={counts.mvpi}
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
        {/* replaced by Tamm api data */}
        {/* <div className={activeTab === 'vehicles' ? 'block' : 'hidden'}>
          <VehiclesContainer />
        </div> */}

          <div className={activeTab === 'absher' ? 'block' : 'hidden'}>
          <AbsherContainer />
        </div>

        {/* Commented out - No data available yet */}
        {/* <div className={activeTab === 'insurance' ? 'block' : 'hidden'}>
          <InsuranceContainer />
        </div>

        <div className={activeTab === 'mvpi' ? 'block' : 'hidden'}>
          <MVPIContainer />
        </div> */}

        <div className={activeTab === 'homeRents' ? 'block' : 'hidden'}>
          <HomeRentsContainer />
        </div>

        <div className={activeTab === 'electricity' ? 'block' : 'hidden'}>
          <ElectricityContainer />
        </div>

        <div className={activeTab === 'socialInsurance' ? 'block' : 'hidden'}>
          <SocialInsuranceContainer />
        </div>

        <div className={activeTab === 'gosi' ? 'block' : 'hidden'}>
          <GOSIContainer />
        </div>
      </div>
    </div>
  );
};

export default App;